import { readFileSync, writeFileSync } from 'fs'
import { upperFirst } from 'scule'
import consola from 'consola'
import type { ChangelogConfig } from './config'
import type { GitCommit } from './git'

export function generateMarkDown (commits: GitCommit[], config: ChangelogConfig) {
  const typeGroups = groupBy(commits, 'type')

  const markdown: string[] = []
  const breakingChanges = []

  const version = JSON.parse(readFileSync('package.json', 'utf8')).version

  // Version Title
  markdown.push('', '## ' + version)

  for (const type in config.types) {
    const group = typeGroups[type]
    if (!group || !group.length) {
      continue
    }

    markdown.push('', '### ' + config.types[type].title, '')
    for (const commit of group.reverse()) {
      const line = formatCommit(commit)
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

  let authors = commits.flatMap(commit => commit.authors.map(author => formatName(author.name)))
  authors = uniq(authors).sort()

  if (authors.length) {
    markdown.push(
      '', '### ' + '❤️  Contributors', '',
      ...authors.map(name => '- ' + name)
    )
  }

  markdown.push('\n\n----\n\n')
  markdown.push(`Changes from **${config.from}...${config.to}**`, '')
  if (config.github) {
    markdown.push(`See all changes: https://github.com/${config.github}/compare/${config.from}...${config.to}`)
  }

  return markdown.join('\n').trim()
}

export function appendFile (markdown: string, fileName: string) {
  try {
    const currentChangelog = readFileSync(`${fileName}.md`)
    const newChangelog = markdown + '\n\n' + currentChangelog
    writeFileSync(`${fileName}.md`, newChangelog)
  } catch (err) {
    consola.error(err)
  }
}

function formatCommit (commit: GitCommit) {
  return '  - ' +
  (commit.scope ? `**${commit.scope.trim()}:** ` : '') +
  (commit.isBreaking ? '⚠️  ' : '') +
   upperFirst(commit.description) +
   ` (${commit.references.join(', ')})`
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

function uniq (items: any[]) {
  return Array.from(new Set(items))
}
