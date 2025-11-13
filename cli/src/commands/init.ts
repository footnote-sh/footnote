import inquirer from 'inquirer'
import { ProfileManager } from '../core/profile.js'
import boxen from 'boxen'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { Profile } from '../core/types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface InitOptions {
  profile?: string
  minimal?: boolean
}

export async function initCommand(options: InitOptions) {
  const pm = new ProfileManager()

  // Check if profile already exists
  if (pm.profileExists()) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Profile already exists. Overwrite?',
        default: false,
      },
    ])

    if (!confirm) {
      console.log(chalk.yellow('\nSetup cancelled.\n'))
      return
    }
  }

  console.log(
    boxen(chalk.cyan('Welcome to Footnote\n') + 'Main thought (not the footnotes)', {
      padding: 1,
      borderColor: 'cyan',
      borderStyle: 'round',
    })
  )

  console.log("\nI'm going to ask you 5 questions to set up your profile.")
  console.log('This takes about 2 minutes.\n')

  console.log(chalk.gray('─'.repeat(50)))

  // Question 1: Work style
  const { workStyle } = await inquirer.prompt([
    {
      type: 'list',
      name: 'workStyle',
      message: "Question 1/5: What's your work style?",
      choices: [
        { name: '🏠 Parent/Caregiver (work during school hours)', value: 'parent' },
        { name: '🌙 Night Owl (deep work in evenings/nights)', value: 'night-owl' },
        { name: '🌅 Early Bird (morning deep work)', value: 'early-bird' },
        { name: '💼 Freelancer (project-based, flexible)', value: 'freelance' },
        { name: '🏢 Corporate (9-5 with meetings)', value: 'corporate' },
      ],
    },
  ])

  // Load template profile
  const profilesDir = path.join(__dirname, '../../../profiles')
  const templatePath = path.join(profilesDir, `${workStyle}.yaml`)
  const profile = yaml.load(fs.readFileSync(templatePath, 'utf8')) as Profile

  console.log(chalk.gray('\n' + '─'.repeat(50)))

  // Question 2: Adjust work hours
  const { adjustHours } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'adjustHours',
      message: `Question 2/5: Your profile suggests ${profile.schedule.work_hours}. Adjust?`,
      default: false,
    },
  ])

  if (adjustHours) {
    const { workHours } = await inquirer.prompt([
      {
        type: 'input',
        name: 'workHours',
        message: 'Enter work hours (e.g., "9am-3pm" or "20:00-02:00"):',
        default: profile.schedule.work_hours,
        validate: (input) => {
          if (pm.validateSchedule(input)) {
            return true
          }
          return 'Invalid format. Use "9am-3pm" or "20:00-02:00"'
        },
      },
    ])
    profile.schedule.work_hours = workHours
  }

  console.log(chalk.gray('\n' + '─'.repeat(50)))

  // Question 3: Late night coding intervention
  const { enableLateNight } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enableLateNight',
      message:
        'Question 3/5: Do you code too late when tired?\n  ' +
        chalk.gray('(Enables late night shutdown reminder)'),
      default: true,
    },
  ])

  if (enableLateNight) {
    const { alertTime } = await inquirer.prompt([
      {
        type: 'input',
        name: 'alertTime',
        message: 'What time should I remind you to sleep?',
        default: profile.schedule.late_night_alert || '1am',
      },
    ])
    profile.schedule.late_night_alert = alertTime
    profile.interventions.late_night_coding = true
  } else {
    profile.interventions.late_night_coding = false
  }

  console.log(chalk.gray('\n' + '─'.repeat(50)))

  // Question 4: Priorities
  console.log('\nQuestion 4/5: What are your 1-3 mission-critical priorities?')
  console.log(chalk.gray('These are your "main thoughts" - the things that matter most\n'))

  const { priority1, priority2, priority3 } = await inquirer.prompt([
    {
      type: 'input',
      name: 'priority1',
      message: 'Priority 1:',
      default: profile.priorities[0],
      validate: (input) => input.trim().length > 0 || 'Priority 1 is required',
    },
    {
      type: 'input',
      name: 'priority2',
      message: 'Priority 2:',
      default: profile.priorities[1],
    },
    {
      type: 'input',
      name: 'priority3',
      message: 'Priority 3:',
      default: profile.priorities[2],
    },
  ])

  profile.priorities = [priority1, priority2, priority3].filter((p) => p && p.trim().length > 0)

  console.log(chalk.gray('\n' + '─'.repeat(50)))

  // Save profile
  await pm.saveProfile(profile)

  console.log(chalk.green('\n✅ Setup complete!\n'))
  console.log(`Profile: ${chalk.cyan(profile.name)}`)
  console.log(`Saved to: ${chalk.gray(pm.getConfigDir() + '/config.yaml')}`)

  console.log('\n' + chalk.bold('Next steps:'))
  console.log('1. Run ' + chalk.cyan('footnote focus') + ' tomorrow morning')
  console.log("2. I'll help you pick ONE thing to complete")
  console.log('3. Type ' + chalk.cyan('footnote --help') + ' anytime\n')
}
