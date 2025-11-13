/**
 * focus command - Set today's main thought/commitment
 */

import inquirer from 'inquirer'
import chalk from 'chalk'
import { StateManager } from '../../state/StateManager.js'
import { CommitmentStore } from '../../state/CommitmentStore.js'

export async function focusCommand(stateManager: StateManager): Promise<void> {
  const commitmentStore = new CommitmentStore(stateManager)

  // Check if already set today
  const existing = commitmentStore.getToday()
  if (existing) {
    console.log(chalk.yellow('\n⚠️  You already set your focus today:\n'))
    console.log(chalk.cyan(`   "${existing.mainThought}"`))
    console.log(chalk.dim(`   (set at ${new Date(existing.createdAt).toLocaleTimeString()})\n`))

    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Do you want to change it?',
        default: false,
      },
    ])

    if (!overwrite) {
      console.log(chalk.dim('\nKeeping existing focus.\n'))
      return
    }
  }

  console.log(chalk.bold("\n🎯 What's your main focus today?\n"))
  console.log(chalk.dim('This is your ONE main thing. Everything else is a footnote.\n'))

  const { mainThought } = await inquirer.prompt([
    {
      type: 'input',
      name: 'mainThought',
      message: 'Your main focus:',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'Please enter your main focus'
        }
        if (input.length < 5) {
          return 'Be more specific (at least 5 characters)'
        }
        return true
      },
    },
  ])

  const commitment = commitmentStore.setMainThought(mainThought.trim())

  console.log(chalk.green('\n✓ Focus set for today:\n'))
  console.log(chalk.cyan(`   "${commitment.mainThought}"`))
  console.log(chalk.dim('\nNow get to work! 💪\n'))
}
