import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

cloudinary.config({
  cloud_name: 'fb7zpbif',
  api_key: '439829747216486',
  api_secret: '9sLPFPMON6UV2vYvPsEtvpaj1Mg',
  secure: true,
});

const assetsDir = 'public/reference-assets';
const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.png'));

async function uploadAll() {
  const mapping = {};

  for (const file of files) {
    const filePath = path.join(assetsDir, file);
    const publicId = file.replace('.png', '');
    try {
      console.log(`Uploading ${file} to Cloudinary...`);
      const res = await cloudinary.uploader.upload(filePath, {
        folder: 'notions/storefront',
        public_id: publicId,
        overwrite: true,
      });
      mapping[publicId] = {
        url: res.secure_url,
        public_id: res.public_id,
      };
      console.log(`Uploaded ${file} -> ${res.secure_url}`);
    } catch (err) {
      console.error(`Failed ${file}:`, err.message);
    }
  }

  fs.writeFileSync('data/cloudinary-assets.json', JSON.stringify(mapping, null, 2));
  console.log('Saved Cloudinary asset mapping to data/cloudinary-assets.json');
}

uploadAll();
