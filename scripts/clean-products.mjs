import sharp from 'sharp';

async function perfectProductCards() {
  const cards = [
    { name: 'bs-linen-casual-shirt', left: 302, top: 420, width: 98, height: 75, bg: [244, 240, 235] },
    { name: 'bs-slim-fit-jeans', left: 412, top: 420, width: 98, height: 75, bg: [244, 240, 235] },
    { name: 'bs-essential-oversized-tee', left: 522, top: 420, width: 98, height: 75, bg: [244, 240, 235] },
    { name: 'bs-classic-white-sneaker', left: 632, top: 420, width: 98, height: 75, bg: [244, 240, 235] },
  ];

  for (const c of cards) {
    const { data, info } = await sharp('public/reference-design.png')
      .extract({ left: c.left, top: c.top, width: c.width, height: c.height })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const buf = Buffer.from(data);
    const { width, height, channels } = info;

    // The top 14 pixels of the card is where the Bestseller badge and Wishlist heart are located
    // Let's sample background at x=50, y=10
    const sampleIdx = (10 * width + 50) * channels;
    const r = buf[sampleIdx], g = buf[sampleIdx+1], b = buf[sampleIdx+2];

    for (let y = 0; y < 14; y++) {
      for (let x = 0; x < width; x++) {
        // If it's shirt, don't touch collar if any; collar starts at y >= 14
        const idx = (y * width + x) * channels;
        buf[idx] = r;
        buf[idx+1] = g;
        buf[idx+2] = b;
      }
    }

    // Upscale to 2.5x Lanczos3 (approx 245 x 188) for crispness
    await sharp(buf, { raw: { width, height, channels } })
      .resize(245, 188, { kernel: sharp.kernel.lanczos3 })
      .toFile(`public/reference-assets/${c.name}.png`);

    console.log(`Cleaned and upscaled ${c.name}`);
  }
}

perfectProductCards().catch(console.error);
