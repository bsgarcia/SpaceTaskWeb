const path = require('path');

module.exports = {
  entry: './src/main.mjs', // Update with your entry file
  output: {
    path: path.resolve(__dirname, 'dist'), // Output directory
    filename: 'bundle.js', // Output bundle filename
  },
};
