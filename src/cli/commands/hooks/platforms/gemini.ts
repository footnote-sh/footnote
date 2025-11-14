/**
 * Gemini CLI hook installer
 */

import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import chalk from 'chalk'

export async function installGeminiHooks(): Promise<void> {
  const geminiDir = path.join(os.homedir(), '.geminicli')
  const configFile = path.join(geminiDir, 'config.yaml')

  // Ensure .geminicli directory exists
  await fs.mkdir(geminiDir, { recursive: true })

  // Read template
  const templatePath = path.join(process.cwd(), 'templates/hooks/gemini-config.yaml')

  let template: string
  try {
    template = await fs.readFile(templatePath, 'utf-8')
  } catch (error) {
    // Fallback: generate config inline
    template = `hooks:
  pre_request:
    command: curl
    args:
      - "-X"
      - "POST"
      - "http://localhost:3040/check-focus"
      - "-H"
      - "Content-Type: application/json"
      - "-d"
      - '{"request": "{{ .prompt }}", "context": {"current_file": "{{ .file }}"}, "source": "gemini"}'
      - "-s"
`
  }

  // Check if config already exists
  try {
    await fs.access(configFile)
    console.log(chalk.yellow(`\n⚠️  Config already exists: ${configFile}`))
    console.log(chalk.dim('Please merge manually or backup existing config first.\n'))
    return
  } catch (error) {
    // File doesn't exist, create it
  }

  // Write config.yaml
  await fs.writeFile(configFile, template)

  console.log(chalk.green(`✓ Gemini CLI hooks installed: ${configFile}`))
  console.log(chalk.dim('\nHook: pre_request'))
  console.log(chalk.dim('  → POST http://localhost:3040/check-focus'))
}

export async function uninstallGeminiHooks(): Promise<void> {
  const configFile = path.join(os.homedir(), '.geminicli/config.yaml')

  try {
    await fs.unlink(configFile)
    console.log(chalk.green('✓ Gemini CLI hooks uninstalled'))
  } catch (error) {
    console.log(chalk.yellow('No hooks found to uninstall'))
  }
}
