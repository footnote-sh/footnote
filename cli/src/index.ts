#!/usr/bin/env node

import { Command } from 'commander'
import { initCommand } from './commands/init.js'
import { focusCommand } from './commands/focus.js'
import { checkCommand } from './commands/check.js'
import { captureCommand } from './commands/capture.js'
import { ProfileManager } from './core/profile.js'

const program = new Command()

program
  .name('footnote')
  .description('ADHD-friendly focus toolkit for developers - Main thought (not the footnotes)')
  .version('0.1.0')
  .addHelpText(
    'after',
    '\nTip: Just type "footnote" to get started (runs init if no profile, or shows status)'
  )

program
  .command('init')
  .description('Set up your profile (2-minute wizard)')
  .option(
    '-p, --profile <name>',
    'Use specific profile (parent, night-owl, early-bird, freelance, corporate)'
  )
  .option('--minimal', 'Start with minimal features')
  .action(initCommand)

program
  .command('focus')
  .description('Morning triage - pick your main thought for today')
  .option('--json', 'Output JSON for programmatic parsing')
  .action(focusCommand)

program
  .command('check')
  .description('Quick status check - see your main thought and time left')
  .option('--json', 'Output JSON for programmatic parsing')
  .action(checkCommand)

program
  .command('capture')
  .description('Capture a footnote (bonus thought) without derailing')
  .argument('<thought>', 'The footnote to capture')
  .option('--json', 'Output JSON for programmatic parsing')
  .action(captureCommand)

// Default action when no command is provided
program.action(async () => {
  const pm = new ProfileManager()

  if (!pm.profileExists()) {
    // No profile yet, run init
    await initCommand({})
  } else {
    // Profile exists, show status
    await checkCommand({})
  }
})

program.parse()
