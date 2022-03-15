const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  devtool: 'inline-source-map',
  entry: './src/index.tsx',
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
        test: /\.worker\.js/,
        use: {
          loader: "worker-loader",
          options: { fallback: true }
        }
      },
      {
        test: /\.wasm$/,
        type:
          "javascript/auto" /** this disables webpacks default handling of wasm */,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "wasm/[name].[hash].[ext]",
              publicPath: "../docs/"
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      fs: false,
      path: require.resolve( 'path-browserify' ),
      os: require.resolve( 'os-browserify' ),
    },
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
