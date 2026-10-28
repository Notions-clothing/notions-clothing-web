import sharp from 'sharp';

async function inspect() {
  const metadata = await sharp('public/reference-design.png').metadata();
  console.log('Reference design dimensions:', metadata.width, 'x', metadata.height);
}

inspect().catch(err => {
  console.error('Sharp error:', err.message);
});
