import nextVitals from 'eslint-config-next/core-web-vitals'

const config = [
  ...nextVitals,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    ignores: [
      'eslint.config.mjs',
      '.next/**',
      '.next.arker-relocated-*/**',
    ],
  },
]

export default config
