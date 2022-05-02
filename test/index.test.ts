import { it, describe } from 'vitest'

describe.skip('changelogen', () => {
  const tests = [
    { input: 'foo', output: 'Hello foo' },
    { input: 'bar', output: 'Hello bar' }
  ]

  for (const test of tests) {
    it(test.input, () => {
      // expect(testFunction(test.input)).eq(test.output)
    })
  }
})
