const fs = require('fs');
const path = require('path');

// Create a simple test image (1x1 pixel PNG)
const testImage = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
  0x49, 0x48, 0x44, 0x52, // IHDR
  0x00, 0x00, 0x00, 0x01, // width: 1
  0x00, 0x00, 0x00, 0x01, // height: 1
  0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
  0x00, 0x00, 0x00, 0x00, // CRC (placeholder)
  0x00, 0x00, 0x00, 0x00, // IEND chunk length
  0x49, 0x45, 0x4E, 0x44, // IEND
  0xAE, 0x42, 0x60, 0x82  // CRC
]);

// Save test image
const testImagePath = path.join(__dirname, 'test_image.png');
fs.writeFileSync(testImagePath, testImage);

console.log('Test image created:', testImagePath);
console.log('Image size:', testImage.length, 'bytes');
console.log('\nTo test the upload endpoint, run:');
console.log('curl -X POST https://receipt-parcer.vercel.app/api/upload-receipt?userId=1&filename=test.png \\');
console.log('  -H "Content-Type: image/png" \\');
console.log('  --data-binary @test_image.png');
console.log('\nOr use the n8n workflow with a Telegram image upload.');