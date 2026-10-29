import fs from 'fs';

const store = JSON.parse(fs.readFileSync('data/store.json', 'utf8'));

const mapping = {
  'men-shirts': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793186802/notions/categories/men-shirts.png',
  'men-jeans': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793186804/notions/categories/men-jeans.png',
  'men-trousers': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793186805/notions/categories/men-trousers.png',
  'men-t-shirts': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793186806/notions/categories/men-t-shirts.png',
  'men-shorts': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793186807/notions/categories/men-shorts.png',
  'men-jackets': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793186808/notions/categories/men-jackets.png',
  'men-dhothis': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793186809/notions/categories/men-dhothis.png',
  'men-kurta': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793186811/notions/categories/men-kurta.png',
  'footwear': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793186812/notions/categories/footwear.png',
  'shoes': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793186812/notions/categories/footwear.png',
  'sandals': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793186812/notions/categories/footwear.png',
  'accessories': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793186813/notions/categories/accessories.png',
  'caps': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793186813/notions/categories/accessories.png',
  'rings': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793186813/notions/categories/accessories.png',
  'bracelet': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793186813/notions/categories/accessories.png',
  'chain': 'https://res.cloudinary.com/fb7zpbif/image/upload/v1793186813/notions/categories/accessories.png',
};

store.categories = store.categories.map(c => {
  if (mapping[c.slug]) {
    c.image_url = mapping[c.slug];
  }
  return c;
});

fs.writeFileSync('data/store.json', JSON.stringify(store, null, 2));
console.log('Updated store.json with fresh category Cloudinary URLs');
