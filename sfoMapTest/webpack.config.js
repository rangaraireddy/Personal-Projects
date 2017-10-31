module.exports = {
    entry: {
        app: './app/app.module.ts',
        mock: './test/mocks/mocks.ts'
    },
    output: {
        path: __dirname + '/build/',
        publicPath: 'build/',
        filename: '[name].bundle.js',
        sourceMapFilename: '[name].bundle.js.map'
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            material_css: __dirname + "/node_modules/angular-material/angular-material.min.css",
            jquery_js: __dirname + "/node_modules/jquery/dist/jquery.min.js"
        }
    },
    module: {
        loaders: [
            {
                test: /\.ts$/,
                use: [
                    { loader: 'awesome-typescript-loader' },
                    { loader: 'tslint-loader', options: { emitErrors: true, failOnHint: true, rulesDirectory: './node_modules/tslint-microsoft-contrib' } }]
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.html$/,
                loader: "raw-loader"
            },
            {
                test: /\.scss$/,
                use: [{
                    loader: "style-loader" // creates style nodes from JS strings
                }, {
                    loader: "css-loader" // translates CSS into CommonJS
                }, {
                    loader: "sass-loader" // compiles Sass to CSS
                }]
            },
            {
                test: /\.(eot|woff|woff2|ttf|svg|png|jpg)$/,
                loader: 'url-loader?limit=30000&name=[name]-[hash].[ext]'
            }
        ]
    },
    devtool: 'source-map',
    plugins: [
    ],
    devServer: {
        publicPath: "/build",
        contentBase: [
            __dirname
        ],
        compress: true,
        https: false,
        overlay: true,
    }
}