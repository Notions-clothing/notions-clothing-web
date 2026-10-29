import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';

cloudinary.config({
  cloud_name: 'fb7zpbif',
  api_key: '439829747216486',
  api_secret: '9sLPFPMON6UV2vYvPsEtvpaj1Mg',
  secure: true,
});

const supabase = createClient(
  'https://vvwizaunsdtnkocwjgwi.supabase.co',
  'sb_publishable_9V6B8kV1_OjwCwdyCU8Dng_VMAuV_cW'
);

const categories = [
  { slug: 'men-shirts', file: 'cat-shirts.png' },
  { slug: 'men-jeans', file: 'cat-jeans.png' },
  { slug: 'men-trousers', file: 'cat-trousers.png' },
  { slug: 'men-t-shirts', file: 'cat-t-shirts.png' },
  { slug: 'men-shorts', file: 'cat-shorts.png' },
  { slug: 'men-jackets', file: 'cat-jackets.png' },
  { slug: 'men-dhothis', file: 'cat-dhothis.png' },
  { slug: 'men-kurta', file: 'cat-kurta.png' },
  { slug: 'footwear', file: 'cat-footwear.png' },
  { slug: 'accessories', file: 'cat-accessories.png' },
];

async function updateCloudinary() {
  for (const cat of categories) {
    const filePath = `public/reference-assets/${cat.file}`;
    console.log(`Uploading ${cat.file} to Cloudinary...`);
    const res = await cloudinary.uploader.upload(filePath, {
      folder: 'notions/categories',
      public_id: cat.slug,
      overwrite: true,
    });
    console.log(`Uploaded ${cat.slug}: ${res.secure_url}`);

    // Update in Supabase
    await supabase.from('categories').update({ image_url: res.secure_url }).eq('slug', cat.slug);
  }
  console.log('All 10 category images uploaded and synced to Supabase!');
}

updateCloudinary().catch(console.error);
