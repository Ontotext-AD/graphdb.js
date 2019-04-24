const fs = require('fs');
const path = require('path');

function loadFile(relativePath) {
  return fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

module.exports = {loadFile};
