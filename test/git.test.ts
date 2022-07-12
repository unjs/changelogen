import { describe, expect, test } from 'vitest'
import { getGitDiff, loadChangelogConfig, parseCommits } from '../src'

describe('git', () => {
  test('getGitDiff should work', async () => {
    const COMMIT_INITIAL = '4554fc49265ac532b14c89cec15e7d21bb55d48b'
    const COMMIT_VER002 = '38d7ba15dccc3a44931bf8bf0abaa0d4d96603eb'
    expect((await getGitDiff(COMMIT_INITIAL, COMMIT_VER002)).length).toBe(2)

    const all = await getGitDiff(undefined)
    expect((await getGitDiff(COMMIT_INITIAL, 'HEAD')).length + 1).toBe(
      all.length
    )
  })

  test('parse', async () => {
    const COMMIT_FROM = '31a08615bb7da611dcaefe33b510d23aa7d2cc29'
    const COMMIT_TO = '27440655a169c2f462d891d2f243db54c174f6b7'

    const commits = await getGitDiff(COMMIT_FROM, COMMIT_TO)
    commits[1].message = 'fix(scope)!: breaking change example, close #123 (#134)'
    expect(commits.map(({ body: _, ...rest }) => rest)).toMatchInlineSnapshot(`
      [
        {
          "author": {
            "email": "anthonyfu117@hotmail.com",
            "name": "Anthony Fu",
          },
          "message": "fix: expose \`./config\` (#10)",
          "shortHash": "2744065",
        },
        {
          "author": {
            "email": "pyapar@gmail.com",
            "name": "Pooya Parsa",
          },
          "message": "fix(scope)!: breaking change example, close #123 (#134)",
          "shortHash": "37c407c",
        },
        {
          "author": {
            "email": "pyapar@gmail.com",
            "name": "Pooya Parsa",
          },
          "message": "build: use dynamic import for execa for cjs support",
          "shortHash": "a794cf1",
        },
      ]
    `)
    const config = await loadChangelogConfig(process.cwd())
    const parsed = parseCommits(commits, config)

    expect(parsed.map(({ body: _, author: __, authors: ___, ...rest }) => rest)).toMatchInlineSnapshot(`
      [
        {
          "description": "expose \`./config\`",
          "isBreaking": false,
          "message": "fix: expose \`./config\` (#10)",
          "references": [
            {
              "type": "pull-request",
              "value": "#10",
            },
            {
              "type": "hash",
              "value": "2744065",
            },
          ],
          "scope": "",
          "shortHash": "2744065",
          "type": "fix",
        },
        {
          "description": "breaking change example, close #123",
          "isBreaking": true,
          "message": "fix(scope)!: breaking change example, close #123 (#134)",
          "references": [
            {
              "type": "pull-request",
              "value": "#134",
            },
            {
              "type": "issue",
              "value": "#123",
            },
            {
              "type": "hash",
              "value": "37c407c",
            },
          ],
          "scope": "scope",
          "shortHash": "37c407c",
          "type": "fix",
        },
        {
          "description": "use dynamic import for execa for cjs support",
          "isBreaking": false,
          "message": "build: use dynamic import for execa for cjs support",
          "references": [
            {
              "type": "hash",
              "value": "a794cf1",
            },
          ],
          "scope": "",
          "shortHash": "a794cf1",
          "type": "build",
        },
      ]
    `)
  })
})
