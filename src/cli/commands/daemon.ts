/**
 * daemon command - Daemon management
 */

import chalk from 'chalk'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export async function daemonCommand(action: string): Promise<void> {
  switch (action) {
    case 'start':
      await startDaemon()
      break

    case 'stop':
      await stopDaemon()
      break

    case 'status':
      await statusDaemon()
      break

    default:
      console.log(chalk.red(`Unknown action: ${action}`))
      console.log(chalk.dim('\nUsage: footnote daemon <start|stop|status>'))
  }
}

async function startDaemon(): Promise<void> {
  console.log(chalk.yellow('\n🚀 Starting Footnote daemon...\n'))

  try {
    // Path to the hook server
    const serverPath = join(__dirname, '../../daemon/hook-server/index.js')

    // Start the server as a background process
    const child = spawn('node', [serverPath], {
      detached: true,
      stdio: 'ignore',
    })

    child.unref()

    console.log(chalk.green('✓ Hook server started'))
    console.log(chalk.dim(`  → http://localhost:3040`))
    console.log(chalk.dim(`  → PID: ${child.pid}\n`))

    console.log(chalk.yellow('🚧 App watcher coming soon\n'))

    console.log(chalk.dim('Next steps:'))
    console.log(chalk.cyan('  footnote hooks install'))
    console.log(chalk.dim('  (or specify platform: footnote hooks install claude-code)\n'))
  } catch (error) {
    console.log(chalk.red('\n✗ Failed to start daemon:'))
    console.log(chalk.dim((error as Error).message))
    process.exit(1)
  }
}

async function stopDaemon(): Promise<void> {
  console.log(chalk.yellow('\n🛑 Stopping Footnote daemon...\n'))

  try {
    // Find and kill the hook server process
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    try {
      // Find process by port 3040
      const { stdout } = await execAsync('lsof -ti:3040')
      const pid = stdout.trim()

      if (pid) {
        await execAsync(`kill ${pid}`)
        console.log(chalk.green('✓ Hook server stopped'))
        console.log(chalk.dim(`  → PID: ${pid}\n`))
      } else {
        console.log(chalk.yellow('Hook server not running\n'))
      }
    } catch (error) {
      console.log(chalk.yellow('Hook server not running\n'))
    }
  } catch (error) {
    console.log(chalk.red('\n✗ Failed to stop daemon:'))
    console.log(chalk.dim((error as Error).message))
    process.exit(1)
  }
}

async function statusDaemon(): Promise<void> {
  console.log(chalk.bold('\n📊 Footnote Daemon Status\n'))

  try {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    // Check hook server
    try {
      const { stdout } = await execAsync('lsof -ti:3040')
      const pid = stdout.trim()

      if (pid) {
        console.log(chalk.green('✓ Hook server: Running'))
        console.log(chalk.dim(`  → http://localhost:3040`))
        console.log(chalk.dim(`  → PID: ${pid}`))

        // Try to get health status
        try {
          const axios = (await import('axios')).default
          const response = await axios.get('http://localhost:3040/health', {
            timeout: 2000,
          })
          if (response.data.hasCommitment) {
            console.log(chalk.green(`  → Commitment: "${response.data.commitment}"`))
          } else {
            console.log(chalk.yellow('  → No commitment set'))
          }
        } catch {
          // Can't reach health endpoint
        }
      } else {
        console.log(chalk.red('✗ Hook server: Not running'))
        console.log(chalk.dim('  → Run: footnote daemon start'))
      }
    } catch (error) {
      console.log(chalk.red('✗ Hook server: Not running'))
      console.log(chalk.dim('  → Run: footnote daemon start'))
    }

    console.log()
    console.log(chalk.yellow('🚧 App watcher: Coming soon\n'))
  } catch (error) {
    console.log(chalk.red('\n✗ Failed to check status:'))
    console.log(chalk.dim((error as Error).message))
    process.exit(1)
  }
}
