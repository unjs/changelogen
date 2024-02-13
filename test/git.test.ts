import { describe, expect, it } from 'vitest'
import consola from 'consola'
import {
  formatReference,
  generateMarkDown,
  getGitDiff,
  getRepoConfig,
  loadChangelogConfig,
  parseCommits,
} from '../src'
import type { RepoConfig } from './../src/repo'

describe('git', () => {
  it('getGitDiff should work', async () => {
    const COMMIT_INITIAL = '4554fc49265ac532b14c89cec15e7d21bb55d48b'
    const COMMIT_VER002 = '38d7ba15dccc3a44931bf8bf0abaa0d4d96603eb'
    expect((await getGitDiff(COMMIT_INITIAL, COMMIT_VER002)).length).toBe(2)

    const all = await getGitDiff(undefined)
    expect((await getGitDiff(COMMIT_INITIAL, 'HEAD')).length + 1).toBe(
      all.length,
    )
  })

  it('parse', async () => {
    const COMMIT_FROM = '1cb15d5dd93302ebd5ff912079ed584efcc6703b'
    const COMMIT_TO = '3828bda8c45933396ddfa869d671473231ce3c95'

    const commits = await getGitDiff(COMMIT_FROM, COMMIT_TO)
    commits[1].message
      = 'fix(scope)!: breaking change example, close #123 (#134)'
    expect(commits.map(({ body: _, ...rest }) => rest)).toMatchInlineSnapshot(`
      [
        {
          "author": {
            "email": "pooya@pi0.io",
            "name": "Pooya Parsa",
          },
          "message": "chore(release): v0.3.5",
          "shortHash": "3828bda",
        },
        {
          "author": {
            "email": "pooya@pi0.io",
            "name": "Pooya Parsa",
          },
          "message": "fix(scope)!: breaking change example, close #123 (#134)",
          "shortHash": "20e622e",
        },
        {
          "author": {
            "email": "pooya@pi0.io",
            "name": "Pooya Parsa",
          },
          "message": "chore(release): v0.3.4",
          "shortHash": "6fc5087",
        },
        {
          "author": {
            "email": "pooya@pi0.io",
            "name": "Pooya Parsa",
          },
          "message": "feat: infer github config from package.json (resolves #37)",
          "shortHash": "c0febf1",
        },
        {
          "author": {
            "email": "pooya@pi0.io",
            "name": "Pooya Parsa",
          },
          "message": "chore(release): v0.3.3",
          "shortHash": "f4f42a3",
        },
        {
          "author": {
            "email": "pooya@pi0.io",
            "name": "Pooya Parsa",
          },
          "message": "fix: consider docs and refactor as semver patch for bump",
          "shortHash": "648ccf1",
        },
        {
          "author": {
            "email": "pooya@pi0.io",
            "name": "Pooya Parsa",
          },
          "message": "feat: expose \`determineSemverChange\` and \`bumpVersion\`",
          "shortHash": "5451f18",
        },
        {
          "author": {
            "email": "pooya@pi0.io",
            "name": "Pooya Parsa",
          },
          "message": "chore: fix typecheck",
          "shortHash": "8796cf1",
        },
        {
          "author": {
            "email": "pooya@pi0.io",
            "name": "Pooya Parsa",
          },
          "message": "chore: update dependencies",
          "shortHash": "c210976",
        },
        {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
          },
          "message": "chore(deps): update all non-major dependencies (#42)",
          "shortHash": "a80e372",
        },
      ]
    `)
    const config = await loadChangelogConfig(process.cwd(), {
      from: COMMIT_FROM,
      to: COMMIT_TO,
    })
    const parsed = parseCommits(commits, config)

    expect(parsed.map(({ body: _, author: __, authors: ___, ...rest }) => rest))
      .toMatchInlineSnapshot(`
      [
        {
          "description": "v0.3.5",
          "isBreaking": false,
          "message": "chore(release): v0.3.5",
          "references": [
            {
              "type": "hash",
              "value": "3828bda",
            },
          ],
          "scope": "release",
          "shortHash": "3828bda",
          "type": "chore",
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
              "value": "20e622e",
            },
          ],
          "scope": "scope",
          "shortHash": "20e622e",
          "type": "fix",
        },
        {
          "description": "v0.3.4",
          "isBreaking": false,
          "message": "chore(release): v0.3.4",
          "references": [
            {
              "type": "hash",
              "value": "6fc5087",
            },
          ],
          "scope": "release",
          "shortHash": "6fc5087",
          "type": "chore",
        },
        {
          "description": "infer github config from package.json",
          "isBreaking": false,
          "message": "feat: infer github config from package.json (resolves #37)",
          "references": [
            {
              "type": "pull-request",
              "value": "#37",
            },
            {
              "type": "hash",
              "value": "c0febf1",
            },
          ],
          "scope": "",
          "shortHash": "c0febf1",
          "type": "feat",
        },
        {
          "description": "v0.3.3",
          "isBreaking": false,
          "message": "chore(release): v0.3.3",
          "references": [
            {
              "type": "hash",
              "value": "f4f42a3",
            },
          ],
          "scope": "release",
          "shortHash": "f4f42a3",
          "type": "chore",
        },
        {
          "description": "consider docs and refactor as semver patch for bump",
          "isBreaking": false,
          "message": "fix: consider docs and refactor as semver patch for bump",
          "references": [
            {
              "type": "hash",
              "value": "648ccf1",
            },
          ],
          "scope": "",
          "shortHash": "648ccf1",
          "type": "fix",
        },
        {
          "description": "expose \`determineSemverChange\` and \`bumpVersion\`",
          "isBreaking": false,
          "message": "feat: expose \`determineSemverChange\` and \`bumpVersion\`",
          "references": [
            {
              "type": "hash",
              "value": "5451f18",
            },
          ],
          "scope": "",
          "shortHash": "5451f18",
          "type": "feat",
        },
        {
          "description": "fix typecheck",
          "isBreaking": false,
          "message": "chore: fix typecheck",
          "references": [
            {
              "type": "hash",
              "value": "8796cf1",
            },
          ],
          "scope": "",
          "shortHash": "8796cf1",
          "type": "chore",
        },
        {
          "description": "update dependencies",
          "isBreaking": false,
          "message": "chore: update dependencies",
          "references": [
            {
              "type": "hash",
              "value": "c210976",
            },
          ],
          "scope": "",
          "shortHash": "c210976",
          "type": "chore",
        },
        {
          "description": "update all non-major dependencies",
          "isBreaking": false,
          "message": "chore(deps): update all non-major dependencies (#42)",
          "references": [
            {
              "type": "pull-request",
              "value": "#42",
            },
            {
              "type": "hash",
              "value": "a80e372",
            },
          ],
          "scope": "deps",
          "shortHash": "a80e372",
          "type": "chore",
        },
      ]
    `)

    const md = await generateMarkDown(parsed, config)
    const date = new Date().toISOString().split('T')[0]
    consola.info(date)

    expect(md).toMatchInlineSnapshot(`
      "## 3828bda8c45933396ddfa869d671473231ce3c95 (${date})

      [compare changes](https://github.com/phojie/changegear/compare/1cb15d5dd93302ebd5ff912079ed584efcc6703b...3828bda8c45933396ddfa869d671473231ce3c95)

      ### 🚀 Enhancements

      - Expose \`determineSemverChange\` and \`bumpVersion\` ([5451f18](https://github.com/phojie/changegear/commit/5451f18))
      - Infer github config from package.json ([#37](https://github.com/phojie/changegear/pull/37))

      ### 🩹 Fixes

      - Consider docs and refactor as semver patch for bump ([648ccf1](https://github.com/phojie/changegear/commit/648ccf1))
      - **scope:** ⚠️  Breaking change example, close #123 ([#134](https://github.com/phojie/changegear/pull/134), [#123](https://github.com/phojie/changegear/issues/123))

      ### 🏡 Chore

      - **deps:** Update all non-major dependencies ([#42](https://github.com/phojie/changegear/pull/42))
      - Update dependencies ([c210976](https://github.com/phojie/changegear/commit/c210976))
      - Fix typecheck ([8796cf1](https://github.com/phojie/changegear/commit/8796cf1))
      - **release:** V0.3.3 ([f4f42a3](https://github.com/phojie/changegear/commit/f4f42a3))
      - **release:** V0.3.4 ([6fc5087](https://github.com/phojie/changegear/commit/6fc5087))
      - **release:** V0.3.5 ([3828bda](https://github.com/phojie/changegear/commit/3828bda))

      #### ⚠️ Breaking Changes

      - **scope:** ⚠️  Breaking change example, close #123 ([#134](https://github.com/phojie/changegear/pull/134), [#123](https://github.com/phojie/changegear/issues/123))

      ### ❤️ Contributors

      - Pooya Parsa ([@pi0](http://github.com/pi0))"
    `)
  })

  it('parse host config', () => {
    expect(getRepoConfig(undefined)).toMatchObject({})
    expect(getRepoConfig('')).toMatchObject({})
    expect(getRepoConfig('unjs')).toMatchObject({})

    const github = {
      provider: 'github',
      repo: 'phojie/changegear',
      domain: 'github.com',
    }
    expect(getRepoConfig('phojie/changegear')).toStrictEqual(github)
    expect(getRepoConfig('github:phojie/changegear')).toStrictEqual(github)
    expect(getRepoConfig('https://github.com/phojie/changegear')).toStrictEqual(
      github,
    )
    expect(
      getRepoConfig('https://github.com/phojie/changegear.git'),
    ).toStrictEqual(github)
    expect(getRepoConfig('git@github.com:phojie/changegear.git')).toStrictEqual(
      github,
    )

    const gitlab = {
      provider: 'gitlab',
      repo: 'phojie/changegear',
      domain: 'gitlab.com',
    }

    expect(getRepoConfig('gitlab:phojie/changegear')).toStrictEqual(gitlab)
    expect(getRepoConfig('https://gitlab.com/phojie/changegear')).toStrictEqual(
      gitlab,
    )
    expect(
      getRepoConfig('https://gitlab.com/phojie/changegear.git'),
    ).toStrictEqual(gitlab)
    expect(getRepoConfig('git@gitlab.com:phojie/changegear.git')).toStrictEqual(
      gitlab,
    )

    const bitbucket = {
      provider: 'bitbucket',
      repo: 'phojie/changegear',
      domain: 'bitbucket.org',
    }

    expect(getRepoConfig('bitbucket:phojie/changegear')).toStrictEqual(
      bitbucket,
    )
    expect(
      getRepoConfig('https://bitbucket.org/phojie/changegear'),
    ).toStrictEqual(bitbucket)
    expect(
      getRepoConfig('https://bitbucket.org/phojie/changegear.git'),
    ).toStrictEqual(bitbucket)
    expect(
      getRepoConfig('https://donaldsh@bitbucket.org/phojie/changegear.git'),
    ).toStrictEqual(bitbucket)
    expect(
      getRepoConfig('git@bitbucket.org:phojie/changegear.git'),
    ).toStrictEqual(bitbucket)

    const selfhosted = {
      repo: 'phojie/changegear',
      domain: 'git.unjs.io',
    }

    expect(getRepoConfig('selfhosted:phojie/changegear')).toMatchObject({
      provider: 'selfhosted',
      repo: 'phojie/changegear',
    })

    expect(
      getRepoConfig('https://git.unjs.io/phojie/changegear'),
    ).toMatchObject(selfhosted)

    expect(
      getRepoConfig('https://git.unjs.io/phojie/changegear.git'),
    ).toMatchObject(selfhosted)
    expect(
      getRepoConfig('https://donaldsh@git.unjs.io/phojie/changegear.git'),
    ).toMatchObject(selfhosted)
    expect(
      getRepoConfig('git@git.unjs.io:phojie/changegear.git'),
    ).toMatchObject(selfhosted)
  })

  it('format reference', () => {
    expect(formatReference({ type: 'hash', value: '3828bda' })).toBe('3828bda')
    expect(formatReference({ type: 'pull-request', value: '#123' })).toBe(
      '#123',
    )
    expect(formatReference({ type: 'issue', value: '#14' })).toBe('#14')

    const github: RepoConfig = {
      provider: 'github',
      repo: 'phojie/changegear',
      domain: 'github.com',
    }

    expect(formatReference({ type: 'hash', value: '3828bda' }, github)).toBe(
      '[3828bda](https://github.com/phojie/changegear/commit/3828bda)',
    )
    expect(
      formatReference({ type: 'pull-request', value: '#123' }, github),
    ).toBe('[#123](https://github.com/phojie/changegear/pull/123)')
    expect(formatReference({ type: 'issue', value: '#14' }, github)).toBe(
      '[#14](https://github.com/phojie/changegear/issues/14)',
    )

    const gitlab: RepoConfig = {
      provider: 'gitlab',
      repo: 'phojie/changegear',
      domain: 'gitlab.com',
    }

    expect(formatReference({ type: 'hash', value: '3828bda' }, gitlab)).toBe(
      '[3828bda](https://gitlab.com/phojie/changegear/commit/3828bda)',
    )
    expect(
      formatReference({ type: 'pull-request', value: '#123' }, gitlab),
    ).toBe('[#123](https://gitlab.com/phojie/changegear/merge_requests/123)')
    expect(formatReference({ type: 'issue', value: '#14' }, gitlab)).toBe(
      '[#14](https://gitlab.com/phojie/changegear/issues/14)',
    )

    const bitbucket: RepoConfig = {
      provider: 'bitbucket',
      repo: 'phojie/changegear',
      domain: 'bitbucket.org',
    }

    expect(formatReference({ type: 'hash', value: '3828bda' }, bitbucket)).toBe(
      '[3828bda](https://bitbucket.org/phojie/changegear/commits/3828bda)',
    )
    expect(
      formatReference({ type: 'pull-request', value: '#123' }, bitbucket),
    ).toBe('[#123](https://bitbucket.org/phojie/changegear/pull-requests/123)')
    expect(formatReference({ type: 'issue', value: '#14' }, bitbucket)).toBe(
      '[#14](https://bitbucket.org/phojie/changegear/issues/14)',
    )

    const unkown: RepoConfig = {
      repo: 'phojie/changegear',
      domain: 'git.unjs.io',
    }

    expect(formatReference({ type: 'hash', value: '3828bda' }, unkown)).toBe(
      '3828bda',
    )
    expect(
      formatReference({ type: 'pull-request', value: '#123' }, unkown),
    ).toBe('#123')
    expect(formatReference({ type: 'issue', value: '#14' }, unkown)).toBe(
      '#14',
    )
  })
})
