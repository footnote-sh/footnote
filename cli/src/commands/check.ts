import { Storage } from '../core/storage.js'
import { ProfileManager } from '../core/profile.js'
import chalk from 'chalk'
import { StatusOutput } from '../core/types.js'

interface CheckOptions {
  json?: boolean
}

export async function checkCommand(options: CheckOptions) {
  const storage = new Storage()
  const pm = new ProfileManager()
  await storage.initialize()

  try {
    const profile = await pm.loadProfile()
    const commitment = storage.getTodayCommitment()

    if (!commitment) {
      if (!options.json) {
        console.log(chalk.yellow('\n📭 No commitment for today yet.'))
        console.log('Run: ' + chalk.cyan('footnote focus') + '\n')
      } else {
        console.log(
          JSON.stringify({
            mainThought: null,
            timeLeft: null,
            footnotes: 0,
            completed: false,
          })
        )
      }
      return
    }

    const footnotes = storage.getRecentFootnotes(100).filter((f) => {
      return f.captured_at.startsWith(commitment.date)
    })

    if (!options.json) {
      console.log(chalk.green('\n✅') + ` Main thought: ${chalk.bold(commitment.main_thought)}`)

      // Calculate time remaining (simplified for MVP)
      const [, endTime] = profile.schedule.work_hours.split('-')
      console.log(chalk.blue('⏰') + ` Work ends: ${endTime.trim()}`)

      console.log(chalk.yellow('📝') + ` Footnotes captured today: ${footnotes.length}`)

      if (commitment.completed) {
        console.log(chalk.green('\n🎉 You completed your main thing!\n'))
      } else {
        console.log(chalk.cyan("\nYou're on track! 🎯\n"))
      }
    } else {
      const output: StatusOutput = {
        mainThought: commitment.main_thought,
        timeLeft: profile.schedule.work_hours.split('-')[1]?.trim() || null,
        footnotes: footnotes.length,
        completed: commitment.completed,
      }
      console.log(JSON.stringify(output, null, 2))
    }
  } finally {
    storage.close()
  }
}
