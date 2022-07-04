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
  return await execCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD'])
}

export async function getCurrentGitTag () {
  return await execCommand('git', ['tag', '--points-at', 'HEAD'])
}

export async function getCurrentGitRef () {
  return await getCurrentGitTag() || await getCurrentGitBranch()
}

export async function getGitDiff (from: string | undefined, to: string = 'HEAD'): Promise<RawGitCommit[]> {
  // https://git-scm.com/docs/pretty-formats
  const r = await execCommand('git', ['--no-pager', 'log', `${from ? `${from}...` : ''}${to}`, '--pretty="----%n%s|%h|%an|%ae%n%b"', '--name-status'])
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
const ConventionalCommitRegex = /(?<type>[a-z]+)(\((?<scope>.+)\))?(?<breaking>!)?: (?<description>.+)/i
const CoAuthoredByRegex = /Co-authored-by:\s*(?<name>.+)(<(?<email>.+)>)/gmi
const ReferencesRegex = /\(#[0-9]+\)/gm

export function parseGitCommit (commit: RawGitCommit, config: ChangelogConfig): GitCommit | null {
  const match = commit.message.match(ConventionalCommitRegex)
  if (!match) {
    return null
  }

  const type = match.groups.type

  let scope = match.groups.scope || ''
  scope = config.scopeMap[scope] || scope

  const isBreaking = Boolean(match.groups.breaking)
  let description = match.groups.description

  // Extract references from message
  const references = []
  const matches = description.matchAll(ReferencesRegex)
  for (const m of matches) {
    references.push(m[0])
  }
  if (!references.length) {
    references.push(commit.shortHash)
  }

  // Remove references and normalize
  description = description.replace(ReferencesRegex, '').trim()

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

async function execCommand (cmd: string, args: string[]) {
  const { execa } = await import('execa')
  const res = await execa(cmd, args)
  return res.stdout
}
