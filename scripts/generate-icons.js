const fs = require('fs');
const path = require('path');

// Create simple orange square placeholder icons using raw PNG data
// These are minimal 1x1 orange pixels that will be scaled

// Simple PNG generator for solid color
function createSimplePNG(size) {
  // Create a simple SVG with HSNEF branding colors
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FF9933;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#800000;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.1}"/>
    <text x="50%" y="55%" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold">H</text>
  </svg>`;

  return svg;
}

const iconsDir = path.join(__dirname, '../public/icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create SVG placeholders (browser will render them even though PNG is preferred)
fs.writeFileSync(path.join(iconsDir, 'icon-192.svg'), createSimplePNG(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.svg'), createSimplePNG(512));

console.log('SVG icons generated. Convert to PNG using:');
console.log('npx sharp-cli -i public/icons/icon-192.svg -o public/icons/icon-192.png');
console.log('npx sharp-cli -i public/icons/icon-512.svg -o public/icons/icon-512.png');
