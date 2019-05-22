const path = require('path');
const {name} = require('./package.json');
const webpack = require('webpack');
const isDev = process.env.NODE_ENV !== 'production';

const DIST_PATH = path.resolve(__dirname, 'lib');

const config = {
  entry: {
    main: './index.js',
  },
  node: {
    process: false
  },
  target: 'node',
  output: {
    path: DIST_PATH,
    filename: `${name}.js`,
    libraryTarget: 'umd',
    library: 'lib',
    umdNamedDefine: true,
    globalObject: `(typeof self !== 'undefined' ? self : this)`
  },
  watchOptions: {
    poll: 1000,
    ignored: ['/node_modules', '/lib', '/docs'],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        }
      }
    ]
  },
  resolve: {
    // Needed for path resolution during packaging
    modules: ['src', 'node_modules']
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
  ],
};

if (isDev) {
  config.devtool = 'eval-source-map';
}

module.exports = config;
