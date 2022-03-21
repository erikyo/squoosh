const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');

const devMode = process.env.NODE_ENV !== "production";

const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const path = require('path');

module.exports = {
  devtool: 'inline-source-map',
  entry: './src/index.ts',
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, '../docs'),
    library: {
      name: 'squoosh',
      type: 'umd'
    },
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
    extensions: ['.ts', '.tsx', '.js', '.wasm'],
    fallback: {
      "fs": false,
      "path": false,
    },
    plugins: [
      new TsconfigPathsPlugin({
        logLevel: 'info',
        extensions: [".ts",".tsx",".wasm"]
      })
    ],
  },
  plugins: [
    new webpack.NormalModuleReplacementPlugin(
      /((~asset-|~chunk-)?url|codec):/,
      path.resolve(__dirname, '../')
    ),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      title: 'Squoosh Browser Demo',
      favicon: "./src/favicon.ico"
    }),
    new MiniCssExtractPlugin({
      filename: devMode ? "[name].css" : "[name].[contenthash].css",
      chunkFilename: devMode ? "[id].css" : "[id].[contenthash].css",
    }),
  ]
};
