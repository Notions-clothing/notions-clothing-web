import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const outDir = 'public/reference-assets';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function slice() {
  const img = sharp('public/reference-design.png');

  // 1. Desktop Hero Full Area (approx x: 10, y: 48, w: 735, h: 217)
  await img.clone()
    .extract({ left: 10, top: 48, width: 735, height: 216 })
    .toFile(`${outDir}/hero-banner.png`);
  console.log('Hero banner extracted');

  // 2. Modern Essentials Left Banner (approx x: 10, y: 400, w: 275, h: 172)
  await img.clone()
    .extract({ left: 10, top: 400, width: 275, height: 172 })
    .toFile(`${outDir}/modern-essentials.png`);
  console.log('Modern essentials extracted');

  // 3. Category cards row (approx x: 20, y: 308, w: 710, h: 65)
  // Each category card is ~62px wide with ~10px gap
  const categories = [
    'shirts', 'jeans', 'trousers', 't-shirts', 'shorts',
    'jackets', 'dhothis', 'kurta', 'footwear', 'accessories'
  ];

  for (let i = 0; i < 10; i++) {
    const left = Math.round(23 + i * 71);
    await img.clone()
      .extract({ left: left, top: 308, width: 62, height: 60 })
      .toFile(`${outDir}/cat-${categories[i]}.png`);
  }
  console.log('Category icons extracted');

  // 4. Best seller product cards
  const bestSellers = [
    { name: 'linen-casual-shirt', left: 302, top: 420, width: 98, height: 75 },
    { name: 'slim-fit-jeans', left: 412, top: 420, width: 98, height: 75 },
    { name: 'essential-oversized-tee', left: 522, top: 420, width: 98, height: 75 },
    { name: 'classic-white-sneaker', left: 632, top: 420, width: 98, height: 75 },
  ];

  for (const bs of bestSellers) {
    await img.clone()
      .extract(bs)
      .toFile(`${outDir}/bs-${bs.name}.png`);
  }
  console.log('Best sellers extracted');

  // 5. Bottom 3 editorial banners
  await img.clone()
    .extract({ left: 10, top: 585, width: 255, height: 80 })
    .toFile(`${outDir}/promo-footwear.png`);

  await img.clone()
    .extract({ left: 275, top: 585, width: 255, height: 80 })
    .toFile(`${outDir}/promo-accessories.png`);

  await img.clone()
    .extract({ left: 540, top: 585, width: 205, height: 80 })
    .toFile(`${outDir}/promo-new-arrivals.png`);
  console.log('Bottom promo banners extracted');
}

slice().catch(console.error);
