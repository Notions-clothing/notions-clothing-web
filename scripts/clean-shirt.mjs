import sharp from 'sharp';

async function cleanShirt() {
  const { data, info } = await sharp('public/reference-assets/bs-linen-casual-shirt-clean.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const buffer = Buffer.from(data);

  // Background color around shirt is approx rgb(244, 240, 235)
  const bgR = 244, bgG = 240, bgB = 235;

  // 1. Remove Bestseller badge from top-left (x: 0 to 140, y: 0 to 80)
  // Let's sample the background at x: 10, y: 150 to get exact color
  const sampleIdx = (150 * width + 10) * channels;
  const sr = buffer[sampleIdx], sg = buffer[sampleIdx+1], sb = buffer[sampleIdx+2];

  for (let y = 0; y < 85; y++) {
    for (let x = 0; x < 142; x++) {
      // Don't overwrite the collar (around x > 135 and y > 50)
      if (x > 130 && y > 45) continue;
      const idx = (y * width + x) * channels;
      buffer[idx] = sr;
      buffer[idx + 1] = sg;
      buffer[idx + 2] = sb;
    }
  }

  // 2. Remove heart icon from top-right (x: 260 to 300, y: 0 to 75)
  for (let y = 0; y < 80; y++) {
    for (let x = 260; x < width; x++) {
      const idx = (y * width + x) * channels;
      buffer[idx] = sr;
      buffer[idx + 1] = sg;
      buffer[idx + 2] = sb;
    }
  }

  await sharp(buffer, { raw: { width, height, channels } })
    .toFile('public/reference-assets/bs-linen-casual-shirt-pure.png');

  console.log('Clean pure linen shirt image generated!');
}

cleanShirt().catch(console.error);
