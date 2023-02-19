import { it, describe, expect } from 'vitest'
import type { ChangelogConfig } from '../src/config'
import { filterCommits, GitCommit } from '../src/git'

describe('automatic resolving of revert commits', () => {
  const tests: ({ 'name': string, input: GitCommit[], output: GitCommit[] })[] = [
    {
      name: 'retain revert commits if the commit they revert is from previous version',
      input: [
        {
          type: 'example',
          scope: '',
          shortHash: 'a12345',
          revertedHashes: ['b12345']
        } as unknown as GitCommit,
        {
          type: 'example',
          scope: '',
          shortHash: 'c12345',
          revertedHashes: ['d12345']
        } as unknown as GitCommit
      ],
      output: [
        {
          type: 'example',
          scope: '',
          shortHash: 'a12345',
          revertedHashes: ['b12345']
        } as unknown as GitCommit,
        {
          type: 'example',
          scope: '',
          shortHash: 'c12345',
          revertedHashes: ['d12345']
        } as unknown as GitCommit
      ]
    },
    {
      name: 'remove revert commits if the commit they revert is within current version',
      input: [
        {
          type: 'example',
          scope: '',
          shortHash: 'a12345',
          revertedHashes: ['b12345']
        } as unknown as GitCommit,
        {
          type: 'example',
          scope: '',
          shortHash: 'b12345',
          revertedHashes: []
        } as unknown as GitCommit,
        {
          type: 'example',
          scope: '',
          shortHash: 'c12345',
          revertedHashes: []
        } as unknown as GitCommit
      ],
      output: [
        {
          type: 'example',
          scope: '',
          shortHash: 'c12345',
          revertedHashes: []
        } as unknown as GitCommit
      ]
    }
  ]

  const config: ChangelogConfig = {
    types: {
      example: { title: 'Example' }
    },
    scopeMap: undefined,
    github: '',
    from: '',
    to: ''
  }

  for (const test of tests) {
    it(test.name, () => {
      expect(filterCommits(test.input, config)).toStrictEqual(test.output)
    })
  }
})
