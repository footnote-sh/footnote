/**
 * focus command - Set today's main thought/commitment
 */

import inquirer from 'inquirer'
import chalk from 'chalk'
import { spawn } from 'child_process'
import { promisify } from 'util'
import { exec } from 'child_process'
import { StateManager } from '../../state/StateManager.js'
import { CommitmentStore } from '../../state/CommitmentStore.js'

const execAsync = promisify(exec)

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

  // Auto-start daemon if not running
  await autoStartDaemon()
}

/**
 * Check if daemon is running and start it if not
 */
async function autoStartDaemon(): Promise<void> {
  try {
    // Check if daemon is already running (port 3040)
    const { stdout } = await execAsync('lsof -ti:3040')
    const pid = stdout.trim()

    if (pid) {
      console.log(chalk.dim('\n✓ Daemon is already running'))
      console.log(chalk.dim('  → Monitoring your focus\n'))
      return
    }
  } catch {
    // Port not in use, daemon not running
  }

  // Start daemon
  try {
    const { startDaemonSilently } = await import('./daemon.js')
    await startDaemonSilently()
    console.log(chalk.dim('\nNow get to work! 💪\n'))
  } catch (error) {
    console.log(chalk.red('\n✗ Failed to start daemon:'))
    console.log(chalk.dim((error as Error).message))
    console.log(chalk.dim('\nYou can start it manually with:'))
    console.log(chalk.cyan('  footnote daemon start\n'))
  }
}
