import { describe, expect, test } from 'vitest'
import { getGitDiff } from '../src'

describe('git', () => {
  const COMMIT_INITIAL = '4554fc49265ac532b14c89cec15e7d21bb55d48b'
  const COMMIT_VER002 = '38d7ba15dccc3a44931bf8bf0abaa0d4d96603eb'

  test('getGitDiff should work', async () => {
    expect((await getGitDiff(COMMIT_INITIAL, COMMIT_VER002)).length).toBe(2)

    const all = await getGitDiff()
    expect((await getGitDiff(COMMIT_INITIAL, 'HEAD')).length + 1).toBe(
      all.length
    )
  })
})
