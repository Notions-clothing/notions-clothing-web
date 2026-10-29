import sharp from 'sharp';

async function extractCrispPromos() {
  // 1. Modern Essentials
  await sharp('public/reference-design.png')
    .extract({ left: 10, top: 400, width: 275, height: 172 })
    .resize(688, 430, { kernel: sharp.kernel.lanczos3 })
    .toFile('public/reference-assets/modern-essentials.png');

  // 2. Footwear banner
  await sharp('public/reference-design.png')
    .extract({ left: 10, top: 585, width: 255, height: 80 })
    .resize(638, 200, { kernel: sharp.kernel.lanczos3 })
    .toFile('public/reference-assets/promo-footwear.png');

  // 3. Accessories banner
  await sharp('public/reference-design.png')
    .extract({ left: 275, top: 585, width: 255, height: 80 })
    .resize(638, 200, { kernel: sharp.kernel.lanczos3 })
    .toFile('public/reference-assets/promo-accessories.png');

  // 4. New Arrivals banner
  await sharp('public/reference-design.png')
    .extract({ left: 540, top: 585, width: 205, height: 80 })
    .resize(512, 200, { kernel: sharp.kernel.lanczos3 })
    .toFile('public/reference-assets/promo-new-arrivals.png');

  console.log('Crisp promo banners extracted and upscaled 2.5x');
}

extractCrispPromos().catch(console.error);
