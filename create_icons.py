from PIL import Image, ImageDraw
import os

icon_dir = "C:/Users/PRIYANSHU BISHT/Desktop/LinkPulse/extension/icons"
os.makedirs(icon_dir, exist_ok=True)

def create_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Shield dimensions
    shield_width = int(size * 0.8)
    shield_height = int(size * 0.9)
    left = (size - shield_width) // 2
    top = (size - shield_height) // 2
    right = left + shield_width
    bottom = top + shield_height
    
    center_x = size // 2
    shield_points = [
        (center_x, top + int(shield_height * 0.1)),
        (left, top + int(shield_height * 0.3)),
        (left + int(shield_width * 0.15), top + int(shield_height * 0.3)),
        (left + int(shield_width * 0.15), bottom - int(shield_height * 0.2)),
        (center_x, bottom),
        (right - int(shield_width * 0.15), bottom - int(shield_height * 0.2)),
        (right - int(shield_width * 0.15), top + int(shield_height * 0.3)),
        (right, top + int(shield_height * 0.3)),
    ]
    
    # Fill shield with indigo
    draw.polygon(shield_points, fill=(99, 102, 241, 255))
    
    # Draw pulse line (zigzag)
    line_start_x = int(size * 0.25)
    line_end_x = int(size * 0.75)
    line_y = size // 2
    points = []
    segments = 3
    for i in range(segments * 2 + 1):
        x = line_start_x + (line_end_x - line_start_x) * i / (segments * 2)
        y = line_y - int(size * 0.1) if i % 2 == 0 else line_y + int(size * 0.1)
        points.append((x, y))
    
    if len(points) > 1:
        draw.line(points, fill=(255, 255, 255, 255), width=max(1, size // 32))
    
    return img

sizes = [16, 48, 128]
for size in sizes:
    img = create_icon(size)
    filepath = f"{icon_dir}/icon{size}.png"
    img.save(filepath, 'PNG')
    print(f"Created {filepath} - {size}x{size}")

print("All icons created successfully")