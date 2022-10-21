#!/usr/bin/env node
import { resolve, dirname, join } from 'path'
import { existsSync, promises as fsp } from 'fs'
import consola from 'consola'
import mri from 'mri'
import { execa } from 'execa'
import fg from 'fast-glob'
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
    output: args.output,
    newVersion: args.r,
    recursive: args.recursive
  })

  const logger = consola.create({ stdout: process.stderr })
  logger.info(`Generating changelog for ${config.from}...${config.to}`)

  const packages = ['package.json']

  if (config.recursive) {
    const globPattern = config.recursive === true ? '**/package.json' : config.recursive
    let recursivePackagesJson = await fg(globPattern, {
      cwd: config.cwd,
      ignore: ['**/node_modules']
    })
    // Remove root package.json since we already have it by default
    recursivePackagesJson = recursivePackagesJson.filter(packageJsonLocation => packageJsonLocation !== 'package.json')
    packages.push(...recursivePackagesJson)
    logger.info(`The following packages were detected : \n - ${packages.join('\n - ')}`)
  }

  for (const packageLocation of packages) {
    const packageLocationDir = dirname(packageLocation)
    const rawCommits = await getGitDiff(config.from, config.to, packageLocationDir)

    // Parse commits as conventional commits
    const commits = parseCommits(rawCommits, config).filter(c =>
      config.types[c.type] &&
      !(c.type === 'chore' && c.scope === 'deps' && !c.isBreaking)
    )

    // Bump version optionally
    const isRootPackage = packageLocation === 'package.json'
    if (args.bump || args.release) {
      const newVersion = await bumpVersion(commits, config, packageLocationDir)

      if (isRootPackage) {
        if (!newVersion) {
          consola.error('Unable to bump version based on changes.')
          process.exit(1)
        } else {
          config.newVersion = newVersion
        }
      }

      // Skip package if no new version
      if (!newVersion) {
        logger.info(`No bump required for package '${packageLocation}'`)
        continue
      }
    }

    // Generate markdown
    const markdown = generateMarkDown(commits, config)

    // Show changelog in CLI unless bumping or releasing
    const displayOnly = !args.bump && !args.release
    if (displayOnly) {
      if (!config.recursive) {
        consola.log('\n\n' + markdown + '\n\n')
      } else {
        consola.log(packageLocationDir + ' : \n\n' + markdown + '\n\n')
      }
    }

    // Update changelog file (only when bumping or releasing or when --output is specified as a file)
    const changelogOutputPath = config.output
    if (typeof changelogOutputPath === 'string' && (args.output || !displayOnly)) {
      let changelogMD: string
      const changelogPath = config.recursive ? join(packageLocationDir, changelogOutputPath) : changelogOutputPath
      if (existsSync(changelogPath)) {
        consola.info(`Updating ${changelogPath}`)
        changelogMD = await fsp.readFile(changelogPath, 'utf8')
      } else {
        consola.info(`Creating  ${changelogPath}`)
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

      await fsp.writeFile(changelogPath, changelogMD)
      // Stage the file in release mode
      if (args.release && args.commit !== false) {
        await execa('git', ['add', changelogPath], { cwd })
      }
    }
  }

  // Commit and tag changes for release mode
  if (args.release) {
    if (args.commit !== false) {
      await execa('git', ['commit', '-am', `chore(release): v${config.newVersion}`], { cwd })
    }
    if (args.tag !== false) {
      await execa('git', ['tag', '-am', 'v' + config.newVersion, 'v' + config.newVersion], { cwd })
    }
  }
}

main().catch(consola.error)
