const path = require('path');
const {name} = require('./package.json');

const isDev = process.env.NODE_ENV !== 'production';

const DIST_PATH = path.resolve(__dirname, 'lib');

const config = {
  entry: {main: './src/index.js'},
  target: 'node',
  output: {
    path: DIST_PATH,
    filename: `${name}.js`,
    libraryTarget: 'umd',
    library: 'lib',
    umdNamedDefine: true,
    globalObject: `(typeof self !== 'undefined' ? self : this)`,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
};

if (isDev) {
  config.devtool = 'eval-source-map';
}

module.exports = config;
