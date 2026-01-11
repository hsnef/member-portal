import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create simple SVG with HSNEF branding colors
function createSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FF9933;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#800000;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>
    <text x="50%" y="58%" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.45}" font-weight="bold">H</text>
  </svg>`;
}

const iconsDir = path.join(__dirname, '../public/icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons
async function generateIcons() {
  const sizes = [192, 512];

  for (const size of sizes) {
    const svg = createSVG(size);
    const outputPath = path.join(iconsDir, `icon-${size}.png`);

    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`Created ${outputPath}`);
  }

  console.log('PWA icons generated successfully!');
}

generateIcons().catch(console.error);
