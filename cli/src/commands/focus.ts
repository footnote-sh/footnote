import inquirer from 'inquirer'
import { ProfileManager } from '../core/profile.js'
import { Storage } from '../core/storage.js'
import { format } from 'date-fns'
import chalk from 'chalk'
import { FocusOutput } from '../core/types.js'

interface FocusOptions {
  json?: boolean
}

export async function focusCommand(options: FocusOptions) {
  const pm = new ProfileManager()
  const storage = new Storage()
  await storage.initialize()

  try {
    const profile = await pm.loadProfile()
    const today = format(new Date(), 'yyyy-MM-dd')
    const dayName = format(new Date(), 'EEEE, MMM d')

    // Check if already committed today
    const existing = storage.getTodayCommitment()
    if (existing) {
      console.log(chalk.yellow(`\n⚠️  You already have a commitment for today:`))
      console.log(chalk.cyan(`→ ${existing.main_thought}\n`))

      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Create a new commitment?',
          default: false,
        },
      ])

      if (!overwrite) {
        console.log(chalk.gray('Keeping existing commitment.\n'))
        storage.close()
        return
      }
    }

    if (!options.json) {
      console.log(chalk.cyan(`\n🌅 Morning Triage - ${dayName}\n`))
      console.log(`Profile: ${chalk.bold(profile.name)}`)
      console.log(`Work hours: ${profile.schedule.work_hours}`)
      console.log(chalk.gray(`Available: ${calculateDuration(profile.schedule.work_hours)}\n`))

      console.log(chalk.gray('─'.repeat(50)))
      console.log(chalk.bold('Your priorities:'))
      profile.priorities.forEach((p, i) => {
        console.log(`${i + 1}. ${p}`)
      })
      console.log(chalk.gray('─'.repeat(50)) + '\n')
    }

    // Manual input for MVP
    const { mainThought } = await inquirer.prompt([
      {
        type: 'input',
        name: 'mainThought',
        message: 'What will you complete TODAY?',
        validate: (input) => input.trim().length > 0 || 'Please enter your main thought',
      },
    ])

    // Ask for footnotes
    const { footnotes } = await inquirer.prompt([
      {
        type: 'input',
        name: 'footnotes',
        message: 'Any other thoughts to capture? (comma-separated, or press Enter to skip)',
      },
    ])

    const footnotesList = footnotes
      ? footnotes
          .split(',')
          .map((f: string) => f.trim())
          .filter((f: string) => f.length > 0)
      : []

    // Save commitment
    storage.saveCommitment({
      date: today,
      main_thought: mainThought,
      footnotes: footnotesList,
      completed: false,
      completion_time: null,
    })

    // Write to markdown
    storage.appendToDailyLog(dayName, mainThought, footnotesList)

    if (!options.json) {
      console.log(chalk.green('\n✅ Commitment logged'))

      if (footnotesList.length > 0) {
        console.log(chalk.yellow('\nFootnotes captured:'))
        footnotesList.forEach((f) => console.log(chalk.gray(`• ${f}`)))
      }

      const [, endTime] = profile.schedule.work_hours.split('-')
      console.log(`\nGood luck! I'll check in at ${endTime.trim()}.\n`)
    } else {
      const output: FocusOutput = {
        date: today,
        mainThought,
        footnotes: footnotesList,
        workHours: profile.schedule.work_hours,
      }
      console.log(JSON.stringify(output, null, 2))
    }
  } finally {
    storage.close()
  }
}

function calculateDuration(workHours: string): string {
  // Simple calculation - parse "9am-3pm" and return duration
  const [start, end] = workHours.split('-').map((t) => t.trim())
  // For MVP, just return the range
  return `${start} to ${end}`
}
