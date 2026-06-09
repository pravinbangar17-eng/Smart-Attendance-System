const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/';
const MODELS_DIR = path.join(__dirname, '..', 'models');

const FILES = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

console.log('Downloading face-api.js weights to local models folder...');

function downloadFile(fileName) {
  return new Promise((resolve, reject) => {
    const destPath = path.join(MODELS_DIR, fileName);
    const file = fs.createWriteStream(destPath);
    const url = `${BASE_URL}${fileName}`;

    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect if any
        https.get(response.headers.location, (redirectResponse) => {
          if (redirectResponse.statusCode !== 200) {
            reject(new Error(`Failed to download ${fileName}: Status ${redirectResponse.statusCode}`));
            return;
          }
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`✓ Downloaded: ${fileName}`);
            resolve();
          });
        }).on('error', (err) => {
          fs.unlinkSync(destPath);
          reject(err);
        });
      } else if (response.statusCode !== 200) {
        fs.unlinkSync(destPath);
        reject(new Error(`Failed to download ${fileName}: Status ${response.statusCode}`));
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Downloaded: ${fileName}`);
          resolve();
        });
      }
    }).on('error', (err) => {
      fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

async function start() {
  try {
    for (const file of FILES) {
      await downloadFile(file);
    }
    console.log('\nAll weights downloaded successfully!');
  } catch (err) {
    console.error('Error downloading weights:', err.message);
    console.log('Falling back to CDN for running face-api.js...');
  }
}

start();
