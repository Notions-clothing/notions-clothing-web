import sharp from 'sharp';

async function measureSections() {
  // Let's extract the whole Best Sellers row from y: 390 to y: 580, x: 10 to 740
  await sharp('public/reference-design.png')
    .extract({ left: 10, top: 390, width: 730, height: 185 })
    .toFile('public/reference-assets/full-bestsellers-row.png');

  // And let's extract the promo banners from y: 575 to 675, x: 10 to 740
  await sharp('public/reference-design.png')
    .extract({ left: 10, top: 575, width: 730, height: 95 })
    .toFile('public/reference-assets/full-promo-row.png');

  console.log('Sections extracted for inspection');
}

measureSections().catch(console.error);
