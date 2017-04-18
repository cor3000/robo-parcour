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
        rules : [{
            test: /\.jsx?$/,
            exclude: /node_modules/,
            use: [{
                loader: 'babel-loader',
                options: {
                    presets: [ 'es2015', 'react'],
                    plugins: ["transform-es2015-destructuring", "transform-object-rest-spread"]
                }
            }, {
                loader: 'eslint-loader',
                options: {
                  fix: true,
                }
            }]
        }]
    }
}
