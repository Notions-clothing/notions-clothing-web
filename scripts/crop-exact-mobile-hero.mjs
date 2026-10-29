import sharp from 'sharp';

async function cropExactMobileHero() {
  await sharp('public/reference-design.png')
    .extract({ left: 779, top: 100, width: 195, height: 182 })
    .resize(585, 546, { kernel: sharp.kernel.lanczos3 })
    .toFile('public/reference-assets/hero-banner-mobile.png');

  console.log('Mobile hero without bezel extracted');
}

cropExactMobileHero().catch(console.error);
