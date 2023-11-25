import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: ['dist', '**/dist/**', 'node_modules', '**/node_modules/**', 'package.json', '**/package.json/**'],
  },
  {
    rules: {
      'unicorn/no-null': 0,
      'unicorn/prefer-top-level-await': 0,
      'unicorn/template-indent': 0,
      'unicorn/no-process-exit': 0,
      'node/prefer-global/process': 'off',
      'vue/no-v-text-v-html-on-component': 'off',
    },
  },
)
