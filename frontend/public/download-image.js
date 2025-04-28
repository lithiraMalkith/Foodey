const fs = require('fs');
const https = require('https');
const path = require('path');

// Function to download image from URL
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        res.pipe(fs.createWriteStream(filepath))
          .on('error', reject)
          .once('close', () => resolve(filepath));
      } else {
        // Consume response data to free up memory
        res.resume();
        reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
      }
    });
  });
}

// Path where we want to save the image
const filepath = path.join(__dirname, 'grocery-store.jpg');

// The URL of the image - replace with the actual URL of the grocery store image
const imageUrl = 'https://example.com/path-to-image.jpg';

// Download the image
downloadImage(imageUrl, filepath)
  .then(downloadedFilepath => {
    console.log(`Image downloaded to ${downloadedFilepath}`);
  })
  .catch(error => {
    console.error('Error downloading image:', error);
  });
