/**
 * Permissions command - check and setup accessibility permissions
 */

import { Command } from 'commander'
import { PermissionChecker } from '../../daemon/permissions/PermissionChecker.js'

export const permissionsCommand = new Command('permissions').description(
  'Manage accessibility permissions for app watching'
)

permissionsCommand
  .command('check')
  .description('Check current permission status')
  .action(async () => {
    const checker = new PermissionChecker()
    const status = await checker.getStatus()

    console.log('\n' + status.message + '\n')

    if (!status.hasPermissions) {
      console.log('App watching requires accessibility permissions to track your activity.')
      console.log('Run: footnote permissions setup\n')
    }
  })

permissionsCommand
  .command('setup')
  .description('Open System Preferences to grant permissions')
  .action(async () => {
    const checker = new PermissionChecker()

    // Check if already has permissions
    const status = await checker.getStatus()
    if (status.hasPermissions) {
      console.log('\n✅ You already have accessibility permissions!\n')
      return
    }

    // Request permissions
    await checker.requestAccessibility()
  })
