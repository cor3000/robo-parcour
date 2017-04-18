var path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    test: './app.jsx',
    player: './client/player.js',
    game: './client/game.js'
  },
  output: {
    filename: './build/[name].js'
  },
  devtool: 'cheap-module-source-map',
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
      query: {
        presets: [ 'es2015', 'react'],
        plugins: ["transform-es2015-destructuring", "transform-object-rest-spread"]
      }
    }]
  }
}