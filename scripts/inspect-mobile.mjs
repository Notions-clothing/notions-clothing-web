import sharp from 'sharp';

async function inspectMobile() {
  // Mobile phone in reference-design.png is approximately from x: 750 to 995, y: 35 to 660
  const meta = await sharp('public/reference-design.png').metadata();
  console.log('Total ref image:', meta.width, 'x', meta.height);

  // Let's extract the mobile frame to see its contents
  await sharp('public/reference-design.png')
    .extract({ left: 750, top: 35, width: 245, height: 625 })
    .toFile('public/reference-assets/mobile-full-frame.png');
  console.log('Mobile frame extracted');
}

inspectMobile().catch(console.error);
