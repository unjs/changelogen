import { resolve } from 'path'
import { loadConfig } from 'c12'
import { readPackageJSON } from 'pkg-types'
import { getLastGitTag, getCurrentGitRef } from './git'
import type { SemverBumpType } from './semver'

export interface ChangelogConfig {
  cwd: string
  types: Record<string, { title: string, semver?: SemverBumpType }>
  scopeMap: Record<string, string>
  github: string
  from: string
  to: string
  newVersion?: string
  output: string | boolean
}

const ConfigDefaults: ChangelogConfig = {
  types: {
    feat: { title: '🚀 Enhancements', semver: 'minor' },
    perf: { title: '🔥 Performance', semver: 'patch' },
    fix: { title: '🩹 Fixes', semver: 'patch' },
    refactor: { title: '💅 Refactors', semver: 'patch' },
    docs: { title: '📖 Documentation', semver: 'patch' },
    build: { title: '📦 Build', semver: 'patch' },
    types: { title: '🌊 Types', semver: 'patch' },
    chore: { title: '🏡 Chore' },
    examples: { title: '🏀 Examples' },
    test: { title: '✅ Tests' },
    style: { title: '🎨 Styles' },
    ci: { title: '🤖 CI' }
  },
  cwd: null,
  github: '',
  from: '',
  to: '',
  output: 'CHANGELOG.md',
  scopeMap: {}
}

export async function loadChangelogConfig (cwd: string, overrides?: Partial<ChangelogConfig>): Promise<ChangelogConfig> {
  const { config } = await loadConfig<ChangelogConfig>({
    cwd,
    name: 'changelog',
    defaults: ConfigDefaults,
    overrides: {
      cwd,
      ...overrides as ChangelogConfig
    }
  })

  if (!config.from) {
    config.from = await getLastGitTag()
  }

  if (!config.to) {
    config.to = await getCurrentGitRef()
  }

  if (!config.output) {
    config.output = false
  } else if (config.output) {
    config.output = config.output === true ? ConfigDefaults.output : resolve(cwd, config.output)
  }

  if (!config.github) {
    const pkg = await readPackageJSON(cwd).catch(() => {})
    if (pkg && pkg.repository) {
      const repo = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository.url
      if (/^[\w]+\/[\w]+$/.test(repo)) {
        config.github = repo
      }
    }
  }

  return config
}
