import buble from 'rollup-plugin-buble'

export default {
  entry: './temp/browser/main.js',
  format: 'iife',
  targets: [
    { dest: './build/js/main.js' }
  ],
  plugins: [
    buble(
      {
        target: {
          chrome: 52,
          firefox: 48,
          safari: 9,
          edge: 13,
        }
      }
    )
  ]
}