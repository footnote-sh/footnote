/**
 * check command - Check current commitment
 */

import chalk from 'chalk'
import { StateManager } from '../../state/StateManager.js'
import { CommitmentStore } from '../../state/CommitmentStore.js'

interface CheckOptions {
  json?: boolean
}

export function checkCommand(stateManager: StateManager, options: CheckOptions): void {
  const commitmentStore = new CommitmentStore(stateManager)
  const today = commitmentStore.getToday()

  if (!today) {
    if (options.json) {
      console.log(JSON.stringify({ commitment: null, footnotes: [] }, null, 2))
    } else {
      console.log(chalk.yellow('\n⚠️  No focus set for today.\n'))
      console.log(chalk.dim('Run'), chalk.cyan('footnote focus'), chalk.dim('to set one.\n'))
    }
    return
  }

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          date: today.date,
          mainThought: today.mainThought,
          footnotes: today.footnotes,
          createdAt: today.createdAt,
          completedAt: today.completedAt,
        },
        null,
        2
      )
    )
  } else {
    console.log(chalk.bold("\n🎯 Today's Focus:\n"))
    console.log(chalk.cyan(`   "${today.mainThought}"`))

    if (today.footnotes.length > 0) {
      console.log(chalk.bold('\n📝 Footnotes:'))
      today.footnotes.forEach((note, i) => {
        console.log(chalk.dim(`   ${i + 1}.`), note)
      })
    }

    console.log(chalk.dim(`\nSet at ${new Date(today.createdAt).toLocaleTimeString()}`))

    if (today.completedAt) {
      console.log(chalk.green(`✓ Completed at ${new Date(today.completedAt).toLocaleTimeString()}`))
    }

    console.log()
  }
}
