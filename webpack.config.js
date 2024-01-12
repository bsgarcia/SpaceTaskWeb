const path = require('path');

module.exports = {
  entry: './src/main.mjs', // Update with your entry file
  output: {
    publicPath: 'dist/', // Where devServer should serve content from
    path: path.resolve(__dirname, 'dist'), // Output directory
    filename: 'bundle.js', // Output bundle filename
  },
};
