import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'fb7zpbif',
  api_key: '439829747216486',
  api_secret: '9sLPFPMON6UV2vYvPsEtvpaj1Mg',
  secure: true,
});

async function uploadLogo() {
  try {
    const uploadRes = await cloudinary.uploader.upload('public/logo.png', {
      folder: 'notions/branding',
      public_id: 'notions_logo_primary',
      overwrite: true,
    });
    console.log('Logo uploaded to Cloudinary successfully:');
    console.log('Secure URL:', uploadRes.secure_url);
    console.log('Public ID:', uploadRes.public_id);
  } catch (err) {
    console.error('Upload error:', err);
  }
}

uploadLogo();
