/**
 * capture command - Capture a footnote
 */

import inquirer from 'inquirer'
import chalk from 'chalk'
import { StateManager } from '../../state/StateManager.js'
import { CommitmentStore } from '../../state/CommitmentStore.js'

export async function captureCommand(stateManager: StateManager, thought?: string): Promise<void> {
  const commitmentStore = new CommitmentStore(stateManager)

  // Check if there's a commitment today
  const today = commitmentStore.getToday()
  if (!today) {
    console.log(chalk.yellow('\n⚠️  No focus set for today.\n'))
    console.log(chalk.dim('Run'), chalk.cyan('footnote focus'), chalk.dim('first.\n'))
    return
  }

  let footnote = thought

  // If no thought provided, prompt for it
  if (!footnote) {
    const { input } = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message: 'Capture a footnote:',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Please enter a thought to capture'
          }
          return true
        },
      },
    ])
    footnote = input
  }

  commitmentStore.addFootnote(footnote.trim())

  console.log(chalk.green('\n✓ Footnote captured'))
  console.log(chalk.dim('Back to your main focus:'), chalk.cyan(today.mainThought))
  console.log()
}
