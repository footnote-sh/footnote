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
    // Path to the main daemon entry point (includes hook server + app watcher)
    const daemonPath = join(__dirname, '../../daemon/index.js')

    // Start the daemon as a background process
    const child = spawn('node', [daemonPath], {
      detached: true,
      stdio: 'inherit', // Show daemon output
    })

    child.unref()

    console.log(chalk.green('\n✓ Daemon started'))
    console.log(chalk.dim(`  → PID: ${child.pid}`))
    console.log(chalk.dim(`  → Hook Server: http://localhost:3040`))
    console.log(chalk.dim(`  → App Watcher: Polling every 5s\n`))

    console.log(chalk.dim('Next steps:'))
    console.log(chalk.cyan('  footnote focus'))
    console.log(chalk.dim('  Set your main commitment, then the daemon will start monitoring\n'))
  } catch (error) {
    console.log(chalk.red('\n✗ Failed to start daemon:'))
    console.log(chalk.dim((error as Error).message))
    process.exit(1)
  }
}

async function stopDaemon(): Promise<void> {
  console.log(chalk.yellow('\n🛑 Stopping Footnote daemon...\n'))

  try {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    let stopped = false

    try {
      // Find process by port 3040 (hook server runs on this port)
      const { stdout } = await execAsync('lsof -ti:3040')
      const pid = stdout.trim()

      if (pid) {
        // Kill the parent daemon process (which includes hook server and app watcher)
        await execAsync(`kill ${pid}`)
        console.log(chalk.green('✓ Daemon stopped'))
        console.log(chalk.dim(`  → PID: ${pid}`))
        console.log(chalk.dim('  → Hook Server: Stopped'))
        console.log(chalk.dim('  → App Watcher: Stopped\n'))
        stopped = true
      }
    } catch (error) {
      // Process not running
    }

    if (!stopped) {
      console.log(chalk.yellow('Daemon not running\n'))
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

    let isRunning = false

    // Check hook server (indicator that daemon is running)
    try {
      const { stdout } = await execAsync('lsof -ti:3040')
      const pid = stdout.trim()

      if (pid) {
        isRunning = true
        console.log(chalk.green('✓ Daemon: Running'))
        console.log(chalk.dim(`  → PID: ${pid}\n`))

        // Hook Server status
        console.log(chalk.green('✓ Hook Server: Running'))
        console.log(chalk.dim(`  → http://localhost:3040`))

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

        console.log()

        // App Watcher status (if daemon is running, app watcher is running)
        console.log(chalk.green('✓ App Watcher: Running'))
        console.log(chalk.dim('  → Polling every 5 seconds'))
        console.log(chalk.dim('  → Database: ~/.footnote/activity.db'))

        // Check permissions
        const { PermissionChecker } = await import('../../daemon/permissions/PermissionChecker.js')
        const checker = new PermissionChecker()
        const hasPermissions = await checker.checkAccessibility()

        if (hasPermissions) {
          console.log(chalk.green('  → Permissions: ✓ Granted'))
        } else {
          console.log(chalk.yellow('  → Permissions: ⚠ Not granted'))
          console.log(chalk.dim('  → Run: footnote permissions setup'))
        }
      }
    } catch (error) {
      // Process not running
    }

    if (!isRunning) {
      console.log(chalk.red('✗ Daemon: Not running'))
      console.log(chalk.dim('  → Run: footnote daemon start\n'))
    } else {
      console.log()
    }
  } catch (error) {
    console.log(chalk.red('\n✗ Failed to check status:'))
    console.log(chalk.dim((error as Error).message))
    process.exit(1)
  }
}
