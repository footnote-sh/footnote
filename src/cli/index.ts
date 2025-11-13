#!/usr/bin/env node

/**
 * Footnote CLI - Main entry point
 */

import { Command } from 'commander'
import chalk from 'chalk'
import { StateManager } from '../state/StateManager.js'
import { ProfileStore } from '../state/ProfileStore.js'
import { focusCommand } from './commands/focus.js'
import { captureCommand } from './commands/capture.js'
import { checkCommand } from './commands/check.js'
import { daemonCommand } from './commands/daemon.js'
import { createHooksCommand } from './commands/hooks/install.js'

const program = new Command()
const stateManager = new StateManager()
const profileStore = new ProfileStore(stateManager)

program.name('footnote').description('Main thought (not the footnotes).').version('0.0.1')

// Check if onboarding needed
if (!stateManager.isOnboardingCompleted() && process.argv[2] !== 'init') {
  console.log(chalk.yellow('\n👋 Welcome to Footnote!\n'))
  console.log(chalk.dim('Run'), chalk.cyan('footnote init'), chalk.dim('to get started\n'))
  process.exit(0)
}

// focus - Set today's main thought/commitment
program
  .command('focus')
  .description('Set your main focus for today')
  .action(() => focusCommand(stateManager))

// capture - Capture a footnote
program
  .command('capture')
  .description('Capture a footnote (idea/task for later)')
  .argument('[thought]', 'The thought to capture')
  .action((thought) => captureCommand(stateManager, thought))

// check - Check current commitment
program
  .command('check')
  .description('Check your current commitment')
  .option('--json', 'Output as JSON')
  .action((options) => checkCommand(stateManager, options))

// daemon - Daemon management
program
  .command('daemon')
  .description('Manage Footnote daemon')
  .argument('<action>', 'start|stop|status')
  .action((action) => daemonCommand(action))

// hooks - Hook management
program.addCommand(createHooksCommand())

// init - Initialize/onboarding (placeholder for now)
program
  .command('init')
  .description('Initialize Footnote profile')
  .action(() => {
    console.log(chalk.yellow('\n🚧 Walkthrough coming soon!\n'))
    console.log(chalk.dim('Creating default profile...\n'))

    const profile = profileStore.createDefault('User', 'developer')
    profileStore.set(profile)

    console.log(chalk.green('✓ Profile created'))
    console.log(
      chalk.dim('\nRun'),
      chalk.cyan('footnote focus'),
      chalk.dim('to set your first commitment\n')
    )
  })

program.parse()
