#!/usr/bin/env node
import { resolve } from 'path'
import { existsSync, promises as fsp } from 'fs'
import consola from 'consola'
import mri from 'mri'
import { execa } from 'execa'
import { getGitDiff, parseCommits } from './git'
import { loadChangelogConfig } from './config'
import { generateMarkDown } from './markdown'
import { bumpVersion } from './semver'

async function main () {
  const args = mri(process.argv.splice(2))
  const cwd = resolve(args._[0] || '')
  process.chdir(cwd)

  const config = await loadChangelogConfig(cwd, {
    from: args.from,
    to: args.to,
    output: args.output
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
  if (config.output) {
    let changelogMD: string
    if (existsSync(config.output)) {
      consola.info(`Updating ${config.output}`)
      changelogMD = await fsp.readFile(config.output, 'utf8')
    } else {
      consola.info(`Creating  ${config.output}`)
      changelogMD = '# Changelog\n\n'
    }

    const lastEntry = changelogMD.match(/^###?\s+.*$/m)

    if (lastEntry) {
      changelogMD =
        changelogMD.slice(0, lastEntry.index) +
        markdown + '\n\n' +
        changelogMD.slice(lastEntry.index)
    } else {
      changelogMD += '\n' + markdown + '\n\n'
    }

    await fsp.writeFile(config.output, changelogMD)
  } else {
    consola.log('\n\n' + markdown + '\n\n')
  }

  // Bump version optionally
  let newVersion
  if (args.bump || args.release) {
    newVersion = await bumpVersion(commits, config)
  }
  // Commit and tag changes for release mode
  if (args.release) {
    if (args.commit !== false) {
      await execa('git', ['commit', '-am', `chore(release): ${newVersion}`], { cwd })
    }
    if (args.tag !== false) {
      await execa('git', ['tag', '-am', 'v' + newVersion, 'v' + newVersion], { cwd })
    }
  }
}

main().catch(consola.error)
