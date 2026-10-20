"""SQLite-backed URL storage for LinkPulse shortener with click tracking."""

import os
import secrets
import sqlite3
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, List
from pathlib import Path

# Configurable database path
DB_PATH = os.getenv("LINKPULSE_TEST_DB") or os.getenv("LINKPULSE_DB_PATH", str(Path(__file__).parent.parent.parent / "data" / "links.db"))

def get_db_connection():
    """Get SQLite connection with proper settings."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    """Initialize database tables if they don't exist."""
    if DB_PATH != ":memory:":
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with get_db_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS links (
                short_code TEXT PRIMARY KEY,
                original_url TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL,
                click_count INTEGER NOT NULL DEFAULT 0,
                qr_enabled INTEGER NOT NULL DEFAULT 0,
                qr_image_path TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS click_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                short_code TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                FOREIGN KEY(short_code) REFERENCES links(short_code) ON DELETE CASCADE
            )
        """)
        conn.commit()

# Initialize DB on import
init_db()

@dataclass
class Link:
    """Shortened link record."""
    original_url: str
    short_code: str
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    clicks: int = 0
    qr_enabled: bool = False
    qr_image_path: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "original_url": self.original_url,
            "short_code": self.short_code,
            "short_url": f"/l/{self.short_code}",
            "created_at": self.created_at.isoformat().replace("+00:00", "Z"),
            "clicks": self.clicks,
            "qr_enabled": self.qr_enabled,
            "qr_image_path": self.qr_image_path,
        }

class URLStore:
    """SQLite-backed URL storage with click tracking and in-memory cache."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or DB_PATH
        self._links: dict[str, Link] = {}
        self._url_to_code: dict[str, str] = {}
        self._load_from_db()

    def _get_conn(self):
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        # Initialize DB on each connection for in-memory databases
        if self.db_path == ":memory:":
            conn.execute("""
                CREATE TABLE IF NOT EXISTS links (
                    short_code TEXT PRIMARY KEY,
                    original_url TEXT NOT NULL UNIQUE,
                    created_at TEXT NOT NULL,
                    click_count INTEGER NOT NULL DEFAULT 0,
                    qr_enabled INTEGER NOT NULL DEFAULT 0,
                    qr_image_path TEXT
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS click_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    short_code TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    FOREIGN KEY(short_code) REFERENCES links(short_code) ON DELETE CASCADE
                )
            """)
            conn.commit()
        return conn

    def _load_from_db(self):
        """Load existing links from database into cache."""
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT short_code, original_url, created_at, click_count, qr_enabled, qr_image_path FROM links"
            ).fetchall()
            for row in rows:
                link = Link(
                    original_url=row["original_url"],
                    short_code=row["short_code"],
                    created_at=datetime.fromisoformat(row["created_at"].replace("Z", "+00:00")),
                    clicks=row["click_count"],
                    qr_enabled=bool(row["qr_enabled"]),
                    qr_image_path=row["qr_image_path"]
                )
                self._links[row["short_code"]] = link
                self._url_to_code[row["original_url"]] = row["short_code"]

    def _save_link(self, link: Link):
            """Save link to database using INSERT or UPDATE to avoid triggering ON DELETE CASCADE."""
            with self._get_conn() as conn:
                # Check if link already exists
                existing = conn.execute(
                    "SELECT 1 FROM links WHERE short_code = ?", (link.short_code,)
                ).fetchone()
            
                if existing:
                    # Update existing link
                    conn.execute(
                        "UPDATE links SET original_url = ?, click_count = ?, qr_enabled = ?, qr_image_path = ? WHERE short_code = ?",
                        (
                            link.original_url,
                            link.clicks,
                            int(link.qr_enabled),
                            link.qr_image_path,
                            link.short_code
                        )
                    )
                else:
                    # Insert new link
                    conn.execute(
                        "INSERT INTO links (short_code, original_url, created_at, click_count, qr_enabled, qr_image_path) VALUES (?, ?, ?, ?, ?, ?)",
                        (
                            link.short_code,
                            link.original_url,
                            link.created_at.isoformat().replace("+00:00", "Z"),
                            link.clicks,
                            int(link.qr_enabled),
                            link.qr_image_path
                        )
                    )
                conn.commit()

    def create_short_url(self, original_url: str, length: int = 6) -> Link:
        """Create a new short URL code."""
        if original_url in self._url_to_code:
            existing_code = self._url_to_code[original_url]
            return self._links[existing_code]

        while True:
            short_code = secrets.token_urlsafe(length)[:length]
            if short_code not in self._links:
                break

        link = Link(original_url=original_url, short_code=short_code)
        self._links[short_code] = link
        self._url_to_code[original_url] = short_code
        self._save_link(link)
        return link

    def get_original_url(self, short_code: str) -> Optional[str]:
            """Get original URL by short code, incrementing click count atomically."""
            if short_code not in self._links:
                # Try to load from DB
                with self._get_conn() as conn:
                    row = conn.execute(
                        "SELECT original_url FROM links WHERE short_code = ?", (short_code,)
                    ).fetchone()
                    if not row:
                        return None
                    # Load link into cache
                    self._load_from_db()
                    if short_code not in self._links:
                        return None

            link = self._links[short_code]
            link.clicks += 1

            # Atomic transaction for DB
            with self._get_conn() as conn:
                now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
                conn.execute(
                    "UPDATE links SET click_count = click_count + 1 WHERE short_code = ?",
                    (short_code,)
                )
                conn.execute(
                    "INSERT INTO click_events (short_code, timestamp) VALUES (?, ?)",
                    (short_code, now)
                )
                conn.commit()

            # Save updated link (uses UPDATE to preserve click_events)
            self._save_link(link)
            return link.original_url

    def get_link(self, short_code: str) -> Optional[Link]:
        """Get full link record by short code."""
        if short_code in self._links:
            return self._links[short_code]
        
        # Load from DB
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT original_url, created_at, click_count, qr_enabled, qr_image_path FROM links WHERE short_code = ?",
                (short_code,)
            ).fetchone()
            if not row:
                return None
            
            link = Link(
                original_url=row["original_url"],
                short_code=short_code,
                created_at=datetime.fromisoformat(row["created_at"].replace("Z", "+00:00")),
                clicks=row["click_count"],
                qr_enabled=bool(row["qr_enabled"]),
                qr_image_path=row["qr_image_path"]
            )
            self._links[short_code] = link
            self._url_to_code[row["original_url"]] = short_code
            return link

    def list_links(self) -> List[Link]:
        """List all links."""
        # Refresh cache from DB to ensure persistence
        self._load_from_db()
        return list(self._links.values())

    def delete_link(self, short_code: str) -> bool:
        """Delete a link by short code."""
        if short_code not in self._links:
            return False
        
        link = self._links[short_code]
        with self._get_conn() as conn:
            conn.execute("DELETE FROM links WHERE short_code = ?", (short_code,))
            conn.commit()
        
        del self._links[short_code]
        self._url_to_code.pop(link.original_url, None)
        return True

    def update_qr_status(self, short_code: str, qr_path: str) -> bool:
        """Update QR code status for a link."""
        if short_code not in self._links:
            return False
        
        link = self._links[short_code]
        link.qr_enabled = True
        link.qr_image_path = qr_path
        self._save_link(link)
        return True

    def get_click_events(self, short_code: str, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[dict]:
        """Get click events for a link with optional date filtering."""
        with self._get_conn() as conn:
            query = "SELECT timestamp FROM click_events WHERE short_code = ?"
            params = [short_code]
            
            if start_date:
                query += " AND timestamp >= ?"
                params.append(start_date)
            if end_date:
                query += " AND timestamp <= ?"
                params.append(end_date)
                
            query += " ORDER BY timestamp DESC"
            
            rows = conn.execute(query, params).fetchall()
            return [{"timestamp": row["timestamp"]} for row in rows]

    def get_all_click_events(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[dict]:
        """Get all click events with optional date filtering."""
        with self._get_conn() as conn:
            query = "SELECT short_code, timestamp FROM click_events WHERE 1=1"
            params = []
            
            if start_date:
                query += " AND timestamp >= ?"
                params.append(start_date)
            if end_date:
                query += " AND timestamp <= ?"
                params.append(end_date)
                
            query += " ORDER BY timestamp DESC"
            
            rows = conn.execute(query, params).fetchall()
            return [{"short_code": row["short_code"], "timestamp": row["timestamp"]} for row in rows]


# Global storage instance
url_store = URLStore()
