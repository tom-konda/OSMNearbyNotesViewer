import buble from 'rollup-plugin-buble'

export default {
  entry: './temp/react-components/app-main.js',
  format: 'iife',
  targets: [
    { dest: './build/js/react-app.js' }
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