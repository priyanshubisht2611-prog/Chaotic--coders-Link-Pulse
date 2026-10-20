const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'frontend', 'dist');
const destPublic = path.join(__dirname, 'public');
const destDist = path.join(__dirname, 'dist');

if (fs.existsSync(src)) {
  fs.cpSync(src, destPublic, { recursive: true });
  fs.cpSync(src, destDist, { recursive: true });
  console.log('Successfully copied frontend build artifacts to ./public and ./dist');
} else {
  console.error('frontend/dist does not exist to copy!');
}
