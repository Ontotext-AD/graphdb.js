const fs = require('fs');
const path = require('path');

function loadFile(relativePath) {
  return fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function readStream(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    stream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    stream.on('error', reject);

    stream.on('end', () => {
      resolve(Buffer.concat(chunks).toString().trim());
    });
  });
}

module.exports = {loadFile, readStream};
