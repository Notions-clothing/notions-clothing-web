import sharp from 'sharp';

async function locate() {
  const { data, info } = await sharp('public/reference-assets/hero-banner.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  console.log('width:', info.width, 'height:', info.height);

  // Let's sample along x=650 from y=0 to y=216 to find dark text pixels
  for (let y = 0; y < info.height; y += 5) {
    const idx = (y * info.width + 650) * info.channels;
    const r = data[idx], g = data[idx+1], b = data[idx+2];
    if (r < 150) {
      console.log(`Dark text pixel at y=${y}: rgb(${r},${g},${b})`);
    }
  }

  // Also check x around 260-310 for left text
  for (let x = 250; x < 320; x += 5) {
    for (let y = 130; y < 190; y += 5) {
      const idx = (y * info.width + x) * info.channels;
      const r = data[idx];
      if (r < 150) {
        console.log(`Left dark text at x=${x}, y=${y}: rgb(${r},${data[idx+1]},${data[idx+2]})`);
      }
    }
  }
}

locate().catch(console.error);
