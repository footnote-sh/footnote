/**
 * Codex wrapper installer (placeholder)
 */

import chalk from 'chalk'

export async function installCodexHooks(): Promise<void> {
  console.log(chalk.yellow('\n🚧 Codex wrapper coming soon!\n'))
  console.log(chalk.dim('This will install a wrapper script that:'))
  console.log(chalk.dim('  - Intercepts Codex requests'))
  console.log(chalk.dim('  - Checks alignment with Footnote server'))
  console.log(chalk.dim('  - Shows interventions in terminal\n'))
}

export async function uninstallCodexHooks(): Promise<void> {
  console.log(chalk.yellow('No Codex hooks to uninstall'))
}
