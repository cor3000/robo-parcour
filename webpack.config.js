const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        player: './src/client/js/player.js',
        game: './src/client/js/game.js'
    },
    output: {
        filename: './build/client/js/[name].js'
    },
    devtool: 'cheap-module-source-map',
    devServer: {
//        publicPath: './build',
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
                    presets: [ 'es2015', 'react' ],
                    plugins: [ 'transform-es2015-destructuring', 'transform-object-rest-spread' ]
                }
            }, {
                loader: 'eslint-loader',
                options: {
                  fix: true,
                }
            }]
        }]
    },
    plugins: [
        new CopyWebpackPlugin([
            { context: './src/client/', from: '*.html',   to: 'build/client' }, 
            { context: './src/client/', from: '**/*.css', to: 'build/client' },
            { context: './src/client/', from: 'img/*.*',  to: 'build/client' }
        ])
    ]
}
