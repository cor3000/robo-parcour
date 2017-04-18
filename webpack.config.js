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
  devServer: {
    proxy: {
      "/ws": {
		target: "ws://localhost:8000",
		ws: true
      }
    }    
  },
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