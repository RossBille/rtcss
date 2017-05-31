import path from "path";
import webpack from 'webpack';

const module = {
    rules: [
        {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['es2015']
                }
            }
        }
    ]
};

const outputPath = path.resolve(__dirname, 'dist');


const uglify =
    new webpack.optimize.UglifyJsPlugin({
        compress: {
            drop_console: true
        }
    });


export default [
    {
        plugins: [uglify],
        module: module,
        entry: "./app/Communication/PeerManager.js",
        output: {
            libraryTarget: "var",
            library: "PeerManager",
            path: outputPath,
            filename: "peerManager.min.js"
        }
    },
    {
        plugins: [uglify],
        module: module,
        entry: "./app/SignallingServer.js",
        output: {
            libraryTarget: "var",
            library: "SignallingServer",
            path: outputPath,
            filename: "signallingServer.min.js"
        }
    },
    {
        plugins: [],
        module: module,
        entry: "./app/Communication/PeerManager.js",
        output: {
            libraryTarget: "var",
            library: "PeerManager",
            path: outputPath,
            filename: "peerManager.js"
        }
    },
    {
        module: module,
        entry: "./app/SignallingServer.js",
        output: {
            libraryTarget: "var",
            library: "SignallingServer",
            path: outputPath,
            filename: "signallingServer.js"
        }
    }
]