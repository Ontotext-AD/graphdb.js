/* eslint-disable */

'use strict';

const path = require('path');
const babel = require('@babel/core');
const {
  writeFile,
  rmdirRecursive,
  mkdirRecursive,
  readdirRecursive
} = require('./fs-utils');

const DEST_FOLDER = './lib';
const SOURCE_FOLDER = './src';

if (require.main === module) {
  rmdirRecursive(DEST_FOLDER);
  mkdirRecursive(DEST_FOLDER);

  const srcFiles = readdirRecursive(SOURCE_FOLDER);
  for (const filepath of srcFiles) {
    if (filepath.endsWith('.js')) {
      buildJSFile(filepath);
    }
  }
}

function buildJSFile(filepath) {
  const srcPath = path.join(SOURCE_FOLDER, filepath);
  const destPath = path.join(DEST_FOLDER, filepath);
  const transpiled = babel.transformFileSync(srcPath);

  writeFile(destPath, transpiled.code);
}
