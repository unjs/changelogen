import { resolve } from 'path'
import { loadConfig } from 'c12'
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
    refactor: { title: '💅 Refactors' },
    examples: { title: '🏀 Examples' },
    docs: { title: '📖 Documentation' },
    chore: { title: '🏡 Chore' },
    build: { title: '📦 Build', semver: 'patch' },
    test: { title: '✅ Tests' },
    types: { title: '🌊 Types', semver: 'patch' },
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

  return config
}
