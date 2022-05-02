import { expect, it, describe } from 'vitest'
import { testFunction } from '../src'

describe('changelogen', () => {
  const tests = [
    { input: 'foo', output: 'Hello foo' },
    { input: 'bar', output: 'Hello bar' }
  ]

  for (const test of tests) {
    it(test.input, () => {
      expect(testFunction(test.input)).eq(test.output)
    })
  }
})
