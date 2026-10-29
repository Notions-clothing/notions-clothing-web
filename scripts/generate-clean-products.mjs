import sharp from 'sharp';

async function generateCleanProductPhotos() {
  // 1. Linen Casual Shirt: extract from reference-design (left: 302, top: 420, width: 98, height: 75)
  const { data: d1, info: i1 } = await sharp('public/reference-design.png')
    .extract({ left: 302, top: 420, width: 98, height: 75 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buf1 = Buffer.from(d1);
  const bg1R = buf1[0], bg1G = buf1[1], bg1B = buf1[2];

  // Clean top-left badge (x: 0 to 48, y: 0 to 32)
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 48; x++) {
      const idx = (y * i1.width + x) * i1.channels;
      buf1[idx] = bg1R;
      buf1[idx+1] = bg1G;
      buf1[idx+2] = bg1B;
    }
  }

  // Clean top-right heart (x: 68 to 98, y: 0 to 32)
  for (let y = 0; y < 32; y++) {
    for (let x = 68; x < i1.width; x++) {
      const idx = (y * i1.width + x) * i1.channels;
      buf1[idx] = bg1R;
      buf1[idx+1] = bg1G;
      buf1[idx+2] = bg1B;
    }
  }

  await sharp(buf1, { raw: { width: i1.width, height: i1.height, channels: i1.channels } })
    .resize(300, 230, { kernel: sharp.kernel.lanczos3 })
    .toFile('public/reference-assets/bs-linen-casual-shirt.png');

  // 2. Slim Fit Jeans: extract (left: 412, top: 420, width: 98, height: 75)
  const { data: d2, info: i2 } = await sharp('public/reference-design.png')
    .extract({ left: 412, top: 420, width: 98, height: 75 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buf2 = Buffer.from(d2);
  const bg2R = buf2[0], bg2G = buf2[1], bg2B = buf2[2];
  // Clean top-right heart (x: 68 to 98, y: 0 to 32)
  for (let y = 0; y < 32; y++) {
    for (let x = 68; x < i2.width; x++) {
      const idx = (y * i2.width + x) * i2.channels;
      buf2[idx] = bg2R;
      buf2[idx+1] = bg2G;
      buf2[idx+2] = bg2B;
    }
  }

  await sharp(buf2, { raw: { width: i2.width, height: i2.height, channels: i2.channels } })
    .resize(300, 230, { kernel: sharp.kernel.lanczos3 })
    .toFile('public/reference-assets/bs-slim-fit-jeans.png');

  // 3. Essential Oversized Tee: extract (left: 522, top: 420, width: 98, height: 75)
  const { data: d3, info: i3 } = await sharp('public/reference-design.png')
    .extract({ left: 522, top: 420, width: 98, height: 75 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buf3 = Buffer.from(d3);
  const bg3R = buf3[0], bg3G = buf3[1], bg3B = buf3[2];
  for (let y = 0; y < 32; y++) {
    for (let x = 68; x < i3.width; x++) {
      const idx = (y * i3.width + x) * i3.channels;
      buf3[idx] = bg3R;
      buf3[idx+1] = bg3G;
      buf3[idx+2] = bg3B;
    }
  }

  await sharp(buf3, { raw: { width: i3.width, height: i3.height, channels: i3.channels } })
    .resize(300, 230, { kernel: sharp.kernel.lanczos3 })
    .toFile('public/reference-assets/bs-essential-oversized-tee.png');

  // 4. Classic White Sneaker: extract (left: 632, top: 420, width: 98, height: 75)
  const { data: d4, info: i4 } = await sharp('public/reference-design.png')
    .extract({ left: 632, top: 420, width: 98, height: 75 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buf4 = Buffer.from(d4);
  const bg4R = buf4[0], bg4G = buf4[1], bg4B = buf4[2];
  for (let y = 0; y < 32; y++) {
    for (let x = 68; x < i4.width; x++) {
      const idx = (y * i4.width + x) * i4.channels;
      buf4[idx] = bg4R;
      buf4[idx+1] = bg4G;
      buf4[idx+2] = bg4B;
    }
  }

  await sharp(buf4, { raw: { width: i4.width, height: i4.height, channels: i4.channels } })
    .resize(300, 230, { kernel: sharp.kernel.lanczos3 })
    .toFile('public/reference-assets/bs-classic-white-sneaker.png');

  console.log('All 4 best seller product images cleaned and upscaled!');
}

generateCleanProductPhotos().catch(console.error);
