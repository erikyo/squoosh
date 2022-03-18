const webpack = require('webpack');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const devMode = process.env.NODE_ENV !== "production";

module.exports = {
  devtool: 'inline-source-map',
  entry: './src/index.ts',
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, '../docs')
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader'
          },
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ]
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
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
    extensions: ['.ts', '.tsx', '.js', '.json'],
    plugins: [
      new TsconfigPathsPlugin({
        logLevel: 'info'
      })
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      title: 'Squoosh Browser Demo'
    }),
    new webpack.ContextReplacementPlugin(
      /(.*)~(asset|chunk)-url:(\.*)/,
      path.resolve(__dirname, '../')
    ),
    new MiniCssExtractPlugin({
      filename: devMode ? "[name].css" : "[name].[contenthash].css",
      chunkFilename: devMode ? "[id].css" : "[id].[contenthash].css",
    }),
  ]
};
