import { promises as fsp } from 'fs'
import { resolve } from 'path'
import semver from 'semver'
import consola from 'consola'
import type { ChangelogConfig } from './config'
import type { GitCommit } from './git'

export type SemverBumpType = 'major' | 'minor' | 'patch'

export function determineSemverChange (commits: GitCommit[], config: ChangelogConfig): SemverBumpType | null {
  let [hasMajor, hasMinor, hasPatch] = [false, false, false]
  for (const commit of commits) {
    const semverType = config.types[commit.type]?.semver
    if (semverType === 'major' || commit.isBreaking) {
      hasMajor = true
    } else if (semverType === 'minor') {
      hasMinor = true
    } else if (semverType === 'patch') {
      hasPatch = true
    }
  }

  return hasMajor ? 'major' : (hasMinor ? 'minor' : (hasPatch ? 'patch' : null))
}

export async function bumpVersion (commits: GitCommit[], config: ChangelogConfig, dir?: string): Promise<string | false> {
  let type = determineSemverChange(commits, config)
  const originalType = type

  const pkgPath = resolve(config.cwd, dir, 'package.json')
  const pkg = JSON.parse(await fsp.readFile(pkgPath, 'utf8').catch(() => '{}')) || {}
  const currentVersion = pkg.version || '0.0.0'

  if (currentVersion.startsWith('0.')) {
    if (type === 'major') {
      type = 'minor'
    } else if (type === 'minor') {
      type = 'patch'
    }
  }

  if ((!config.recursive || !dir || dir === '.') && config.newVersion) {
    pkg.version = config.newVersion
  } else if (type) {
    // eslint-disable-next-line import/no-named-as-default-member
    pkg.version = semver.inc(currentVersion, type)
  }

  if (pkg.version === currentVersion) {
    return false
  }

  consola.info(`Bumping version ${dir && dir !== '.' ? `in ${dir} ` : ''}from ${currentVersion} to ${pkg.version} (${originalType})`)
  await fsp.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')

  return pkg.version
}
