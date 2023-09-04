import path from 'path'
import webpack from 'webpack'

const isProduction = process.env.NODE_ENV === 'production'

const config = {
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  mode: isProduction ? 'production' : 'development',
  output: {
    path: path.resolve('dist'),
    filename: 'index.bundle.js'
  },
  optimization: {
    minimize: isProduction
  },
  plugins: [],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts']
  }
}

export default config
