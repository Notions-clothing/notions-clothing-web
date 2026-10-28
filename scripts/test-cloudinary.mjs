import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'fb7zpbif',
  api_key: '439829747216486',
  api_secret: '9sLPFPMON6UV2vYvPsEtvpaj1Mg',
  secure: true,
});

async function testCloudinary() {
  console.log('Testing Cloudinary ping/usage...');
  try {
    const result = await cloudinary.api.ping();
    console.log('Cloudinary ping result:', result);
    const usage = await cloudinary.api.usage();
    console.log('Cloudinary usage plan:', usage.plan);
  } catch (err) {
    console.error('Cloudinary error:', err);
  }
}

testCloudinary();
