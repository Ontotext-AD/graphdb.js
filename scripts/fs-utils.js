/* eslint-disable */

'use strict';

const fs = require('fs');
const path = require('path');

function mkdirRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, {recursive: true});
  }
}

function rmdirRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    for (const name of fs.readdirSync(dirPath)) {
      const fullPath = path.join(dirPath, name);
      if (fs.lstatSync(fullPath).isDirectory()) {
        rmdirRecursive(fullPath);
      } else {
        fs.unlinkSync(fullPath);
      }
    }
    fs.rmdirSync(dirPath);
  }
}

function readdirRecursive(dirPath, opts = {}) {
  const { ignoreDir } = opts;
  const result = [];
  for (const name of fs.readdirSync(dirPath)) {
    const fullPath = path.join(dirPath, name);
    if (!fs.lstatSync(fullPath).isDirectory()) {
      result.push(name);
      continue;
    }

    if (ignoreDir && ignoreDir.test(name)) {
      continue;
    }
    const list = readdirRecursive(path.join(dirPath, name), opts).map(f =>
      path.join(name, f)
    );
    result.push(...list);
  }
  return result;
}

function writeFile(destPath, data) {
  mkdirRecursive(path.dirname(destPath));
  fs.writeFileSync(destPath, data);
}

function copyFile(srcPath, destPath) {
  mkdirRecursive(path.dirname(destPath));
  fs.copyFileSync(srcPath, destPath);
}

module.exports = {
  copyFile,
  writeFile,
  rmdirRecursive,
  mkdirRecursive,
  readdirRecursive,
};
