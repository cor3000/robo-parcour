const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

const clientBuildPath = path.join(__dirname, './build/client')

module.exports = {
    entry: {
        player: './src/client/js/player.js',
        game: './src/client/js/game.js'
    },
    output: {
        path: clientBuildPath,
        filename: './js/[name].js',
        //publicPath: clientBuildPath
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
                    presets: [ 'es2015', 'react' ],
                    plugins: [ 'transform-es2015-destructuring', 'transform-object-rest-spread' ]
                }
            }, {
                loader: 'eslint-loader',
                options: {
                    fix: true
                }
            }]
        }, {
            test: /\.css$/,
            exclude: /node_modules/,
            use: [ 
                'style-loader', 
                {
                    loader: 'css-loader',
                    options : {
//                        minimize: true,
                        sourceMap: true
                    }
                }
            ]
        }/*, {
            test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
            loader: 'url-loader',
            options: {
                limit: 1000
            }
        }*/, {
            test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
            loader: 'file-loader',
            options: {
                name: '[name].[ext]', /*?[hash]*/
                publicPath: './',
                outputPath: 'img/'
            }
        }]
    },
    plugins: [
//        new webpack.optimize.UglifyJsPlugin(),
        new CopyWebpackPlugin([
            { context: './src/client/', from: '*.html',   to: clientBuildPath}//, 
        ])
    ]
}
