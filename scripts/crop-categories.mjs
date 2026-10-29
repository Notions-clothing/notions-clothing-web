import sharp from 'sharp';
import fs from 'fs';

// In 1024x695 image:
// Header: y: 0 to 45
// Hero: y: 46 to 264
// "Shop by Category" header: y: 275 to 295
// Category cards: y: 300 to 365
// Category card boxes (inside beige rounded rectangle): y: 304 to 358 (h: 54)
// Let's measure the 10 cards along x-axis from x: 22 to x: 730
// Width of each box is ~58px, gap is ~15px

const categories = [
  { name: 'shirts', left: 24, top: 303, width: 60, height: 55 },
  { name: 'jeans', left: 96, top: 303, width: 60, height: 55 },
  { name: 'trousers', left: 168, top: 303, width: 60, height: 55 },
  { name: 't-shirts', left: 239, top: 303, width: 60, height: 55 },
  { name: 'shorts', left: 311, top: 303, width: 60, height: 55 },
  { name: 'jackets', left: 382, top: 303, width: 60, height: 55 },
  { name: 'dhothis', left: 453, top: 303, width: 60, height: 55 },
  { name: 'kurta', left: 524, top: 303, width: 60, height: 55 },
  { name: 'footwear', left: 596, top: 303, width: 60, height: 55 },
  { name: 'accessories', left: 667, top: 303, width: 60, height: 55 },
];

async function cropCategories() {
  for (const cat of categories) {
    const outPath = `public/reference-assets/cat-${cat.name}.png`;
    await sharp('public/reference-design.png')
      .extract({ left: cat.left, top: cat.top, width: cat.width, height: cat.height })
      .resize(160, 146, { kernel: sharp.kernel.lanczos3 }) // Crisp 2.5x upscale
      .toFile(outPath);
    console.log(`Cropped & upscaled ${cat.name} -> ${outPath}`);
  }
}

cropCategories().catch(console.error);
