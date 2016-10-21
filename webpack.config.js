module.exports = {
    entry: './temp/react-components/app-main.js',
    output: {
        path: './build/js',
        filename: 'react-app.js',
    },
    resolve: {
        extensions: ['', '.js'],
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: '/node_modules/'
            }
        ]
    }
}