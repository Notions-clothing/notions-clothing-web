import sharp from 'sharp';

async function check() {
  const meta = await sharp('public/reference-design.png').metadata();
  console.log('Image dimensions:', meta.width, 'x', meta.height);
}

check();
