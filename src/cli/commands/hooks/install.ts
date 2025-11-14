/**
 * Hook installation command
 */

import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { installClaudeCodeHooks } from './platforms/claude-code.js'
import { installGeminiHooks } from './platforms/gemini.js'

export function createHooksCommand(): Command {
  const hooks = new Command('hooks').description('Manage AI assistant hooks')

  hooks
    .command('install')
    .description('Install hooks for an AI assistant')
    .argument('[platform]', 'Platform: claude-code, gemini, codex')
    .action(async (platform?: string) => {
      let selectedPlatform = platform

      if (!selectedPlatform) {
        const { platform: chosen } = await inquirer.prompt([
          {
            type: 'list',
            name: 'platform',
            message: 'Which platform do you want to install hooks for?',
            choices: [
              { name: 'Claude Code', value: 'claude-code' },
              { name: 'Gemini CLI', value: 'gemini' },
              { name: 'Codex (Coming soon)', value: 'codex', disabled: true },
            ],
          },
        ])
        selectedPlatform = chosen
      }

      console.log(chalk.yellow(`\n🔧 Installing ${selectedPlatform} hooks...\n`))

      try {
        switch (selectedPlatform) {
          case 'claude-code':
            await installClaudeCodeHooks()
            break
          case 'gemini':
            await installGeminiHooks()
            break
          case 'codex':
            console.log(chalk.yellow('Codex hooks coming soon!'))
            break
          default:
            console.log(chalk.red(`Unknown platform: ${selectedPlatform}`))
            console.log(chalk.dim('\nSupported: claude-code, gemini'))
            process.exit(1)
        }

        console.log(chalk.green('\n✓ Hooks installed successfully!'))
        console.log(chalk.dim('\nNext steps:'))
        console.log(chalk.cyan('  1. footnote daemon start'))
        console.log(chalk.cyan('  2. footnote focus'))
        console.log(
          chalk.dim(
            '  3. Make an off-track request in your AI assistant and watch the intervention!\n'
          )
        )
      } catch (error) {
        console.log(chalk.red('\n✗ Installation failed:'))
        console.log(chalk.dim((error as Error).message))
        process.exit(1)
      }
    })

  hooks
    .command('uninstall')
    .description('Uninstall hooks for an AI assistant')
    .argument('[platform]', 'Platform: claude-code, gemini')
    .action(async (platform?: string) => {
      console.log(chalk.yellow('\n🚧 Uninstall command coming soon!\n'))
    })

  hooks
    .command('status')
    .description('Check hook installation status')
    .action(() => {
      console.log(chalk.yellow('\n🚧 Status command coming soon!\n'))
    })

  return hooks
}
