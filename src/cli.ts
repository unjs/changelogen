#!/usr/bin/env node
import { resolve } from 'path'
import consola from 'consola'
import mri from 'mri'
import { getGitDiff, parseCommits } from './git'
import { loadChangelogConfig } from './config'
import { appendFile, generateMarkDown } from './markdown'

async function main () {
  const args = mri(process.argv.splice(2))
  const cwd = resolve(args._[0] || '')
  process.chdir(cwd)

  const config = await loadChangelogConfig(cwd, {
    from: args.from,
    to: args.to,
    filename: args.filename
  })

  const logger = consola.create({ stdout: process.stderr })
  logger.info(`Generating changelog for ${config.from}...${config.to}`)

  const rawCommits = await getGitDiff(config.from, config.to)

  // Parse commits as conventional commits
  const commits = parseCommits(rawCommits, config).filter(c =>
    config.types[c.type] &&
    c.scope !== 'deps'
  )

  // Generate markdown
  const markdown = generateMarkDown(commits, config)

  // Update changelog file
  if (config.appendFile) {
    consola.info(`Updating ${config.filename}.md`)
    appendFile(markdown, config.filename)
  }

  consola.log('\n\n' + markdown + '\n\n')
}

main().catch(consola.error)
