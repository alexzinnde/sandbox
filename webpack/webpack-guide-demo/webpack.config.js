const path = require('path');

module.exports = {
  entry: './src/index.js',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
};