/**
 * Claude Code hook installer
 */

import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import chalk from 'chalk'

export async function installClaudeCodeHooks(): Promise<void> {
  const claudeDir = path.join(os.homedir(), '.claude')
  const hooksFile = path.join(claudeDir, 'hooks.json')

  // Ensure .claude directory exists
  await fs.mkdir(claudeDir, { recursive: true })

  // Read template
  const templatePath = path.join(process.cwd(), 'templates/hooks/claude-code-hooks.json')

  let template: string
  try {
    template = await fs.readFile(templatePath, 'utf-8')
  } catch (error) {
    // Fallback: generate hooks.json inline if template missing
    template = JSON.stringify(
      {
        hooks: {
          UserPromptSubmit: {
            command: 'curl',
            args: [
              '-X',
              'POST',
              'http://localhost:3040/check-focus',
              '-H',
              'Content-Type: application/json',
              '-d',
              '{"request": "$PROMPT", "context": {"current_file": "$FILE", "git_branch": "$GIT_BRANCH"}, "source": "claude-code"}',
              '-s',
            ],
          },
        },
      },
      null,
      2
    )
  }

  // Check if hooks.json already exists
  let existingHooks: any = { hooks: {} }
  try {
    const existing = await fs.readFile(hooksFile, 'utf-8')
    existingHooks = JSON.parse(existing)
  } catch (error) {
    // File doesn't exist, that's fine
  }

  // Merge hooks
  const newHooks = JSON.parse(template)
  const merged = {
    ...existingHooks,
    hooks: {
      ...existingHooks.hooks,
      ...newHooks.hooks,
    },
  }

  // Write hooks.json
  await fs.writeFile(hooksFile, JSON.stringify(merged, null, 2))

  console.log(chalk.green(`✓ Claude Code hooks installed: ${hooksFile}`))
  console.log(chalk.dim('\nHook: UserPromptSubmit'))
  console.log(chalk.dim('  → POST http://localhost:3040/check-focus'))
}

export async function uninstallClaudeCodeHooks(): Promise<void> {
  const hooksFile = path.join(os.homedir(), '.claude/hooks.json')

  try {
    const existing = await fs.readFile(hooksFile, 'utf-8')
    const hooks = JSON.parse(existing)

    // Remove Footnote hooks
    if (hooks.hooks?.UserPromptSubmit) {
      delete hooks.hooks.UserPromptSubmit
    }

    await fs.writeFile(hooksFile, JSON.stringify(hooks, null, 2))
    console.log(chalk.green('✓ Claude Code hooks uninstalled'))
  } catch (error) {
    console.log(chalk.yellow('No hooks found to uninstall'))
  }
}
