async function testRoute(name, url) {
  try {
    const res = await fetch(url);
    console.log(`[${res.status}] ${name} -> ${url}`);
    if (res.status !== 200) {
      console.error(`Error on ${name}: status ${res.status}`);
    }
  } catch (e) {
    console.error(`Failed ${name}:`, e.message);
  }
}

async function run() {
  console.log('Testing NOTIONS® Storefront & API Routes...\n');
  await testRoute('Homepage', 'http://localhost:3000/');
  await testRoute('Public Products API', 'http://localhost:3000/api/products');
  await testRoute('Category Men', 'http://localhost:3000/category/men');
  await testRoute('Category Shirts', 'http://localhost:3000/category/men-shirts');
  await testRoute('Category Footwear', 'http://localhost:3000/category/footwear');
  await testRoute('Category Accessories', 'http://localhost:3000/category/accessories');
  await testRoute('Product Linen Casual Shirt', 'http://localhost:3000/product/linen-casual-shirt');
  await testRoute('Product Classic White Sneaker', 'http://localhost:3000/product/classic-white-sneaker');
  await testRoute('Search Page', 'http://localhost:3000/search?q=shirt');
  await testRoute('New Arrivals Page', 'http://localhost:3000/new-arrivals');
  await testRoute('Offers Page', 'http://localhost:3000/offers');
  await testRoute('Wishlist Page', 'http://localhost:3000/wishlist');
  await testRoute('Checkout Page', 'http://localhost:3000/checkout');
  await testRoute('Account Page', 'http://localhost:3000/account');
  await testRoute('Admin Dashboard', 'http://localhost:3000/admin');
  await testRoute('Admin Products API', 'http://localhost:3000/api/admin/products');
  await testRoute('Admin Categories API', 'http://localhost:3000/api/admin/categories');
  await testRoute('Admin Banners API', 'http://localhost:3000/api/admin/banners');
  await testRoute('Admin Orders API', 'http://localhost:3000/api/admin/orders');
  console.log('\nAll route verifications complete.');
}

run();
