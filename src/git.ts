import { execa } from 'execa'
import type { ChangelogConfig } from './config'

export interface GitCommitAuthor {
  name: string
  email: string
}

export interface RawGitCommit {
  message: string
  body: string
  shortHash: string
  author: GitCommitAuthor
}

export interface GitCommit extends RawGitCommit {
  description: string
  type: string
  scope: string
  references: string[]
  authors: GitCommitAuthor[]
  isBreaking: boolean
}

export async function getLastGitTag () {
  const r = await execCommand('git', ['--no-pager', 'tag', '-l', '--sort=taggerdate']).then(r => r.split('\n'))
  return r[r.length - 1]
}

export async function getCurrentGitBranch () {
  const r = await execCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD'])
  return r
}

export async function getGitDiff (from, to): Promise<RawGitCommit[]> {
  // https://git-scm.com/docs/pretty-formats
  const r = await execCommand('git', ['--no-pager', 'log', `${from}...${to}`, '--pretty="----%n%s|%h|%an|%ae%n%b"', '--name-status'])
  return r.split('----\n').splice(1).map((line) => {
    const [firstLine, ..._body] = line.split('\n')
    const [message, shortHash, authorName, authorEmail] = firstLine.split('|')
    const r: RawGitCommit = {
      message,
      shortHash,
      author: { name: authorName, email: authorEmail },
      body: _body.join('\n')
    }
    return r
  })
}

export function parseCommits (commits: RawGitCommit[], config: ChangelogConfig): GitCommit[] {
  return commits.map(commit => parseGitCommit(commit, config)).filter(Boolean)
}

// https://www.conventionalcommits.org/en/v1.0.0/
// https://regex101.com/r/FSfNvA/1
const ConventionalCommitRegex = /(?<type>[a-z]+)(\((?<scope>.+)\))?(?<breaking>!)?: (?<description>.+)/gmi
const CoAuthoredByRegex = /Co-authored-by:\s*(?<name>.+)(<(?<email>.+)>)/gmi

export function parseGitCommit (commit: RawGitCommit, config: ChangelogConfig): GitCommit | null {
  const match = ConventionalCommitRegex.exec(commit.message)
  if (!match) {
    return null
  }

  const type = match.groups.type

  let scope = match.groups.scope || 'general'
  scope = config.scopeMap[scope] || scope

  const isBreaking = Boolean(match.groups.breaking)
  let description = match.groups.description

  // Extract references from message
  const references = []
  const referencesRegex = /#[0-9]+/g
  let m
  while (m = referencesRegex.exec(description)) { // eslint-disable-line no-cond-assign
    references.push(m[0])
  }
  if (!references.length) {
    references.push(commit.shortHash)
  }

  // Remove references and normalize
  description = description.replace(referencesRegex, '').replace(/\(\)/g, '').trim()

  // Find all authors
  const authors: GitCommitAuthor[] = [commit.author]
  for (const match of commit.body.matchAll(CoAuthoredByRegex)) {
    authors.push({
      name: (match.groups.name || '').trim(),
      email: (match.groups.email || '').trim()
    })
  }

  return {
    ...commit,
    authors,
    description,
    type,
    scope,
    references,
    isBreaking
  }
}

function execCommand (cmd, args) {
  return execa(cmd, args).then(r => r.stdout)
}
