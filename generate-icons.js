const sharp = require('sharp');
const fs = require('fs');

const svgBuffer = Buffer.from(`
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0a0f1e" />
  <text 
    x="50%" 
    y="55%" 
    font-family="system-ui, sans-serif" 
    font-weight="900" 
    font-size="380" 
    fill="#00b4ff" 
    text-anchor="middle" 
    dominant-baseline="middle"
  >
    K
  </text>
</svg>
`);

if (!fs.existsSync('public/icons')) {
    fs.mkdirSync('public/icons', { recursive: true });
}

console.log("Generating 192x192 icon...");
sharp(svgBuffer)
  .resize(192, 192)
  .png()
  .toFile('public/icons/icon-192.png')
  .then(() => console.log('192x192 created successfully.'))
  .catch(err => console.error(err));

console.log("Generating 512x512 icon...");
sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile('public/icons/icon-512.png')
  .then(() => console.log('512x512 created successfully.'))
  .catch(err => console.error(err));
