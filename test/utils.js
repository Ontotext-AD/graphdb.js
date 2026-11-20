const fs = require('fs');
const path = require('path');

function loadFile(relativePath) {
  const content = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
  return content.replace(/\r\n/g, '\n');
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
        const content = Buffer.concat(chunks).toString().trim();
        resolve(content.replace(/\r\n/g, '\n'));
      }
    });
  });
}

function readObjectsStream(stream) {
  return readStream(stream, true);
}

module.exports = {loadFile, readStream, readObjectsStream};
