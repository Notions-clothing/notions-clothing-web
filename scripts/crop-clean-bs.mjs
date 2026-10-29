import sharp from 'sharp';

async function cropBestSellers() {
  // In reference-design.png (1024x695):
  // Modern Essentials card is at left: 10, top: 400, width: 275, height: 172
  // Best seller product cards start around x: 300 to 735, y: 415 to 570
  // Each product photo box:
  // Shirt: left: 302, top: 420, width: 98, height: 75 -> inside it has shirt photo
  // The actual photo inside the card is between y: 430 and 495, x: 302 and 400
  // If we crop from top: 432 (below the bestseller badge), or clean the badge:
  
  // 1. Linen Casual Shirt
  const shirt = await sharp('public/reference-design.png')
    .extract({ left: 300, top: 423, width: 100, height: 78 })
    .toBuffer();
  
  // Let's also create 2x upscaled versions with lanczos3
  await sharp('public/reference-design.png')
    .extract({ left: 300, top: 423, width: 100, height: 78 })
    .resize(300, 234, { kernel: sharp.kernel.lanczos3 })
    .toFile('public/reference-assets/bs-linen-casual-shirt-clean.png');

  // 2. Slim Fit Jeans
  await sharp('public/reference-design.png')
    .extract({ left: 410, top: 423, width: 100, height: 78 })
    .resize(300, 234, { kernel: sharp.kernel.lanczos3 })
    .toFile('public/reference-assets/bs-slim-fit-jeans-clean.png');

  // 3. Essential Oversized Tee
  await sharp('public/reference-design.png')
    .extract({ left: 520, top: 423, width: 100, height: 78 })
    .resize(300, 234, { kernel: sharp.kernel.lanczos3 })
    .toFile('public/reference-assets/bs-essential-oversized-tee-clean.png');

  // 4. Classic White Sneaker
  await sharp('public/reference-design.png')
    .extract({ left: 630, top: 423, width: 100, height: 78 })
    .resize(300, 234, { kernel: sharp.kernel.lanczos3 })
    .toFile('public/reference-assets/bs-classic-white-sneaker-clean.png');

  console.log('Clean best seller product images generated');
}

cropBestSellers().catch(console.error);
