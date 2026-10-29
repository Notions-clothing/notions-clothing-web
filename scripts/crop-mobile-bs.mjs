import sharp from 'sharp';

async function cropMobileBS() {
  // Mobile frame was x: 750 to 995, y: 35 to 660
  // Inside mobile frame:
  // Best Sellers heading is around y: 395
  // Product cards are around y: 415 to 540
  // Card 1 (Linen shirt): x: 770 to 865, y: 415 to 540
  // Card 2 (Jeans): x: 880 to 975, y: 415 to 540

  await sharp('public/reference-design.png')
    .extract({ left: 770, top: 415, width: 98, height: 125 })
    .toFile('public/reference-assets/mobile-shirt-card.png');

  await sharp('public/reference-design.png')
    .extract({ left: 880, top: 415, width: 98, height: 125 })
    .toFile('public/reference-assets/mobile-jeans-card.png');

  console.log('Mobile product cards extracted');
}

cropMobileBS().catch(console.error);
