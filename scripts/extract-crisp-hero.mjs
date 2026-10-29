import sharp from 'sharp';

async function extractCrispHero() {
  // Desktop Hero
  await sharp('public/reference-design.png')
    .extract({ left: 10, top: 48, width: 735, height: 216 })
    .resize(1838, 540, { kernel: sharp.kernel.lanczos3 })
    .toFile('public/reference-assets/hero-banner-desktop.png');

  // Mobile Hero
  await sharp('public/reference-design.png')
    .extract({ left: 765, top: 98, width: 220, height: 260 })
    .resize(550, 650, { kernel: sharp.kernel.lanczos3 })
    .toFile('public/reference-assets/hero-banner-mobile.png');

  console.log('Crisp Desktop & Mobile Hero Banners extracted');
}

extractCrispHero().catch(console.error);
