import { upperFirst } from 'scule'
import { convert } from 'convert-gitmoji'
import { fetch } from 'node-fetch-native'
import type { ChangelogConfig } from './config'
import type { GitCommit, Reference } from './git'

export async function generateMarkDown (commits: GitCommit[], config: ChangelogConfig) {
  const typeGroups = groupBy(commits, 'type')

  const markdown: string[] = []
  const breakingChanges = []

  // Version Title
  const v = config.newVersion && `v${config.newVersion}`
  markdown.push('',
    '## ' + (v || `${config.from}...${config.to}`)
    , '')

  if (config.github) {
    markdown.push(`[compare changes](https://github.com/${config.github}/compare/${config.from}...${v || config.to})`, '')
  }

  for (const type in config.types) {
    const group = typeGroups[type]
    if (!group || !group.length) {
      continue
    }

    markdown.push('', '### ' + config.types[type].title, '')
    for (const commit of group.reverse()) {
      const line = formatCommit(commit, config)
      markdown.push(line)
      if (commit.isBreaking) {
        breakingChanges.push(line)
      }
    }
  }

  if (breakingChanges.length) {
    markdown.push(
      '', '#### ⚠️  Breaking Changes', '',
      ...breakingChanges
    )
  }

  const _authors = new Map<string, { email: Set<string>, github?: string }>()
  for (const commit of commits) {
    if (!commit.author) { continue }
    const name = formatName(commit.author.name)
    if (!name || name.includes('[bot]')) {
      continue
    }
    if (!_authors.has(name)) {
      _authors.set(name, { email: new Set([commit.author.email]) })
    } else {
      const entry = _authors.get(name)
      entry.email.add(commit.author.email)
    }
  }

  // Try to map authors to github usernames
  await Promise.all(Array.from(_authors.keys()).map(async (authorName) => {
    const meta = _authors.get(authorName)
    for (const email of meta.email) {
      const { user } = await fetch(`https://ungh.cc/users/find/${email}`)
        .then(r => r.json())
        .catch(() => ({ user: null }))
      if (user) {
        meta.github = user.username
        break
      }
    }
  }))

  const authors = Array.from(_authors.entries()).map(e => ({ name: e[0], ...e[1] }))

  if (authors.length) {
    markdown.push(
      '', '### ' + '❤️  Contributors', '',
      ...authors.map((i) => {
        const _email = Array.from(i.email).filter(e => !e.includes('noreply.github.com'))[0]
        const email = _email ? `<${_email}>` : ''
        const github = i.github ? `([@${i.github}](http://github.com/${i.github}))` : ''
        return `- ${i.name} ${github || email}`
      })
    )
  }

  return convert(markdown.join('\n').trim(), true)
}

function formatCommit (commit: GitCommit, config: ChangelogConfig) {
  return '  - ' +
  (commit.scope ? `**${commit.scope.trim()}:** ` : '') +
  (commit.isBreaking ? '⚠️  ' : '') +
  upperFirst(commit.description) +
  formatReferences(commit.references, config)
}

const refTypeMap: Record<Reference['type'], string> = {
  'pull-request': 'pull',
  hash: 'commit',
  issue: 'ssue'
}

function formatReference (ref: Reference, config: ChangelogConfig) {
  if (!config.github) {
    return ref.value
  }
  return `[${ref.value}](https://github.com/${config.github}/${refTypeMap[ref.type]}/${ref.value.replace(/^#/, '')})`
}

function formatReferences (references: Reference[], config: ChangelogConfig) {
  const pr = references.filter(ref => ref.type === 'pull-request')
  const issue = references.filter(ref => ref.type === 'issue')
  if (pr.length || issue.length) {
    return ' (' + [...pr, ...issue].map(ref => formatReference(ref, config)).join(', ') + ')'
  }
  if (references.length) {
    return ' (' + formatReference(references[0], config) + ')'
  }
  return ''
}

// function formatTitle (title: string = '') {
//   return title.length <= 3 ? title.toUpperCase() : upperFirst(title)
// }

function formatName (name: string = '') {
  return name.split(' ').map(p => upperFirst(p.trim())).join(' ')
}

function groupBy (items: any[], key: string) {
  const groups = {}
  for (const item of items) {
    groups[item[key]] = groups[item[key]] || []
    groups[item[key]].push(item)
  }
  return groups
}
