async function testCheckout() {
  console.log('Testing End-to-End Checkout & Order Lifecycle...\n');

  // 1. Create order
  const initRes = await fetch('http://localhost:3000/api/checkout/razorpay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [
        {
          productId: 'prod-linen-shirt',
          selectedSize: 'L',
          quantity: 1,
        },
        {
          productId: 'prod-white-sneaker',
          selectedSize: '9',
          quantity: 1,
        },
      ],
      customer: {
        name: 'Aditya Roy',
        email: 'aditya.roy@notions-test.com',
        phone: '+91 9876543210',
        shipping_address: {
          street: 'Penthouse 14B, Sky Promenade, Lavelle Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postal_code: '560001',
          country: 'India',
        },
      },
    }),
  });

  const initData = await initRes.json();
  console.log('1. Order Initialized:', {
    orderNumber: initData.orderNumber,
    subtotal: initData.subtotal,
    shippingAmount: initData.shippingAmount,
    totalAmount: initData.amount,
  });

  // 2. Verify payment & persist order
  const verifyRes = await fetch('http://localhost:3000/api/checkout/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: initData.razorpayOrderId,
      razorpay_payment_id: `pay_test_${Date.now()}`,
      razorpay_signature: 'test_verified_signature',
      orderData: {
        orderNumber: initData.orderNumber,
        amount: initData.amount,
        subtotal: initData.subtotal,
        shippingAmount: initData.shippingAmount,
        customer: {
          name: 'Aditya Roy',
          email: 'aditya.roy@notions-test.com',
          phone: '+91 9876543210',
          shipping_address: {
            street: 'Penthouse 14B, Sky Promenade, Lavelle Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            postal_code: '560001',
            country: 'India',
          },
        },
        items: initData.items,
      },
    }),
  });

  const verifyData = await verifyRes.json();
  console.log('2. Payment Verified & Order Persisted:', verifyData.success);
  console.log('   Saved Order Number:', verifyData.order?.order_number);

  // 3. Verify confirmation page renders 200
  const confirmRes = await fetch(`http://localhost:3000/order-confirmation/${initData.orderNumber}`);
  console.log(`3. Order Confirmation Page [${confirmRes.status}]`);
}

testCheckout().catch(console.error);
