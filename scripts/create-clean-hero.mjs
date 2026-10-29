import sharp from 'sharp';

async function createCleanHero() {
  const { data, info } = await sharp('public/reference-assets/hero-banner.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const buffer = Buffer.from(data);

  // 1. Clean the left text area (x: 0 to 285)
  // Let's create a natural architectural wall gradient matching the surrounding wall
  for (let y = 0; y < height; y++) {
    // Calculate wall tone based on vertical gradient:
    // y=0: rgb(246, 243, 237)
    // y=height: rgb(233, 225, 215)
    const t = y / height;
    const r = Math.round(246 * (1 - t) + 233 * t);
    const g = Math.round(243 * (1 - t) + 225 * t);
    const b = Math.round(237 * (1 - t) + 215 * t);

    for (let x = 0; x < 285; x++) {
      // Near x=285 (blend zone from 260 to 285), blend into existing pixels
      const idx = (y * width + x) * channels;
      if (x < 260) {
        buffer[idx] = r;
        buffer[idx + 1] = g;
        buffer[idx + 2] = b;
      } else {
        const blend = (x - 260) / 25; // 0 to 1
        buffer[idx] = Math.round(r * (1 - blend) + buffer[idx] * blend);
        buffer[idx + 1] = Math.round(g * (1 - blend) + buffer[idx + 1] * blend);
        buffer[idx + 2] = Math.round(b * (1 - blend) + buffer[idx + 2] * blend);
      }
    }
  }

  // 2. Clean top-right "Style Beyond Trends" (x: 585 to 735, y: 10 to 75)
  // Wall tone behind top-right is rgb(242, 238, 232)
  for (let y = 10; y < 75; y++) {
    for (let x = 585; x < width - 10; x++) {
      const idx = (y * width + x) * channels;
      const t = (y - 10) / 65;
      const r = Math.round(242 * (1 - t) + 238 * t);
      const g = Math.round(238 * (1 - t) + 234 * t);
      const b = Math.round(232 * (1 - t) + 228 * t);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
    }
  }

  // 3. Clean bottom-right "01 02 03 < >" (x: 580 to 735, y: 160 to 210)
  // Concrete block tone is rgb(215, 205, 195) to rgb(200, 190, 180)
  for (let y = 160; y < 210; y++) {
    for (let x = 580; x < width - 10; x++) {
      const idx = (y * width + x) * channels;
      const t = (y - 160) / 50;
      const r = Math.round(218 * (1 - t) + 205 * t);
      const g = Math.round(208 * (1 - t) + 195 * t);
      const b = Math.round(198 * (1 - t) + 185 * t);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
    }
  }

  // Upscale to 2x (1470 x 432) for crisp retina display
  await sharp(buffer, { raw: { width, height, channels } })
    .resize(1470, 432, { kernel: sharp.kernel.lanczos3 })
    .toFile('public/reference-assets/hero-banner-clean.png');

  console.log('Clean 2x hero banner generated: public/reference-assets/hero-banner-clean.png');
}

createCleanHero().catch(console.error);
