const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/index.tsx',
  target: ['node'],
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, '../docs')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader'
          },
          {
            loader: 'ts-loader',
          },
        ]
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          "style-loader",
          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          "sass-loader",
        ],
      },
      {
        test: /\.wasm/,
        type: 'asset/resource'
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      title: 'Squoosh Browser Demo'
    }),
    new webpack.NormalModuleReplacementPlugin(
      /(.*)~(asset|chunk)-url:(\.*)/,
      function (resource) {
        resource.request = resource.request.replace(
          /~(?:asset|chunk)-url:/,
          ``
        );
      }
    ),
  ],
  experiments: {
    topLevelAwait: true,
  }
};
