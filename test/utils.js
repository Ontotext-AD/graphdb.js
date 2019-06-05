const fs = require('fs');
const path = require('path');

function loadFile(relativePath) {
  return fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function readStream(stream, isObjectsStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    stream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    stream.on('error', reject);

    stream.on('end', () => {
      if (isObjectsStream) {
        resolve(chunks);
      } else {
        resolve(Buffer.concat(chunks).toString().trim());
      }
    });
  });
}

function readObjectsStream(stream) {
  return readStream(stream, true);
}

module.exports = {loadFile, readStream, readObjectsStream};
