import buble from 'rollup-plugin-buble'

export default {
  entry: './temp/react-components/app-main.js',
  format: 'cjs',
  targets: [
    { dest: './temp/react-components/react-app.js' }
  ],
  plugins: [
    buble(
      {
        target: {
          chrome: 52,
          firefox: 48,
          safari: 9,
          edge: 12,
        }
      }
    )
  ]
}