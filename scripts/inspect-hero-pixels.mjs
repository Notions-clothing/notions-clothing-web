import sharp from 'sharp';

async function test() {
  const { data, info } = await sharp('public/reference-assets/hero-banner.png')
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  console.log('Hero banner width:', info.width, 'height:', info.height, 'channels:', info.channels);
  for (let y = 10; y < info.height; y += 40) {
    const samples = [];
    for (let x = 10; x <= 260; x += 50) {
      const idx = (y * info.width + x) * info.channels;
      samples.push(`x=${x}: rgb(${data[idx]},${data[idx+1]},${data[idx+2]})`);
    }
    console.log(`y=${y}:`, samples.join(' | '));
  }
}

test().catch(console.error);
