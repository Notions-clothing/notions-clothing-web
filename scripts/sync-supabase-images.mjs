import { createClient } from '@supabase/supabase-js';

const url = 'https://vvwizaunsdtnkocwjgwi.supabase.co';
const key = 'sb_publishable_9V6B8kV1_OjwCwdyCU8Dng_VMAuV_cW';

const supabase = createClient(url, key);

const mapping = {
  'men-shirts': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183109/notions/storefront/cat-shirts.png',
  'men-jeans': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183107/notions/storefront/cat-jeans.png',
  'men-trousers': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183112/notions/storefront/cat-trousers.png',
  'men-t-shirts': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183111/notions/storefront/cat-t-shirts.png',
  'men-shorts': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183110/notions/storefront/cat-shorts.png',
  'men-jackets': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183106/notions/storefront/cat-jackets.png',
  'men-dhothis': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183104/notions/storefront/cat-dhothis.png',
  'men-kurta': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183108/notions/storefront/cat-kurta.png',
  'footwear': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183105/notions/storefront/cat-footwear.png',
  'shoes': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183105/notions/storefront/cat-footwear.png',
  'sandals': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183105/notions/storefront/cat-footwear.png',
  'accessories': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183103/notions/storefront/cat-accessories.png',
  'caps': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183103/notions/storefront/cat-accessories.png',
  'rings': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183103/notions/storefront/cat-accessories.png',
  'bracelet': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183103/notions/storefront/cat-accessories.png',
  'chain': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183103/notions/storefront/cat-accessories.png',
  'men': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793183109/notions/storefront/cat-shirts.png',
};

async function sync() {
  console.log('Syncing Cloudinary image URLs to Supabase categories...');
  for (const [slug, imgUrl] of Object.entries(mapping)) {
    const { error } = await supabase
      .from('categories')
      .update({ image_url: imgUrl })
      .eq('slug', slug);
    if (error) {
      console.log(`Update ${slug} error:`, error.message);
    } else {
      console.log(`Updated ${slug} -> ${imgUrl}`);
    }
  }
}

sync();
