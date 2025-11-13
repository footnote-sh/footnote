import { Storage } from '../core/storage.js'
import chalk from 'chalk'
import { CaptureOutput } from '../core/types.js'

interface CaptureOptions {
  json?: boolean
}

export async function captureCommand(thought: string, options: CaptureOptions) {
  const storage = new Storage()
  await storage.initialize()

  try {
    const timestamp = new Date().toISOString()

    storage.saveFootnote(thought)
    storage.appendToFootnotes(thought, timestamp)

    const commitment = storage.getTodayCommitment()

    if (!options.json) {
      console.log(chalk.green('\n📝 Captured to footnotes:'))
      console.log(chalk.cyan(`→ "${thought}"`))

      if (commitment) {
        console.log(`\nMain thought today: ${chalk.bold(commitment.main_thought)}`)
        console.log(chalk.gray('(Still on track)\n'))
      } else {
        console.log(
          chalk.yellow('\n💡 Tip: Run') +
            chalk.cyan(' footnote focus ') +
            chalk.yellow('to set your main thought\n')
        )
      }
    } else {
      const output: CaptureOutput = {
        captured: thought,
        timestamp,
        mainThought: commitment?.main_thought || null,
      }
      console.log(JSON.stringify(output, null, 2))
    }
  } finally {
    storage.close()
  }
}
