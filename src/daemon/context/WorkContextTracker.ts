/**
 * Work Context Tracker - tracks recent files/commands from Claude Code hooks
 * Provides rich context about what the user is actually working on
 */

export interface WorkContext {
  recentFiles: string[] // Files touched in last N minutes
  recentCommands: string[] // Commands run in last N minutes
  currentDirectory: string
  projectDirectories: string[] // Unique project directories from recent activity
  lastActivityTime: Date
}

export class WorkContextTracker {
  private recentFiles: Map<string, Date> = new Map()
  private recentCommands: Map<string, Date> = new Map()
  private projectDirs: Map<string, Date> = new Map()
  private currentDirectory: string = process.cwd()
  private readonly CONTEXT_TTL_MS = 10 * 60 * 1000 // 10 minutes

  /**
   * Record a file being worked on (from Read/Edit/Write hooks)
   */
  trackFile(filePath: string): void {
    this.recentFiles.set(filePath, new Date())
    this.cleanupOldEntries()
  }

  /**
   * Record a command being run (from Bash hooks)
   */
  trackCommand(command: string): void {
    this.recentCommands.set(command, new Date())
    this.cleanupOldEntries()
  }

  /**
   * Update current working directory and track as project directory
   */
  updateDirectory(dir: string): void {
    this.currentDirectory = dir
    if (dir) {
      this.projectDirs.set(dir, new Date())
    }
  }

  /**
   * Get current work context
   */
  getContext(): WorkContext {
    this.cleanupOldEntries()

    return {
      recentFiles: Array.from(this.recentFiles.keys()),
      recentCommands: Array.from(this.recentCommands.keys()),
      currentDirectory: this.currentDirectory,
      projectDirectories: Array.from(this.projectDirs.keys()),
      lastActivityTime: this.getLastActivityTime() || new Date(Date.now() - this.CONTEXT_TTL_MS),
    }
  }

  /**
   * Check if any recent files/commands/projects match commitment keywords
   */
  hasRelevantActivity(commitmentKeywords: string[]): boolean {
    const context = this.getContext()

    // Check project directories first (strongest signal)
    for (const projectDir of context.projectDirectories) {
      const dirLower = projectDir.toLowerCase()
      if (commitmentKeywords.some((kw) => dirLower.includes(kw.toLowerCase()))) {
        return true
      }
    }

    // Check file paths
    for (const file of context.recentFiles) {
      const fileLower = file.toLowerCase()
      if (commitmentKeywords.some((kw) => fileLower.includes(kw.toLowerCase()))) {
        return true
      }
    }

    // Check commands
    for (const cmd of context.recentCommands) {
      const cmdLower = cmd.toLowerCase()
      if (commitmentKeywords.some((kw) => cmdLower.includes(kw.toLowerCase()))) {
        return true
      }
    }

    return false
  }

  /**
   * Check if current/recent project directories match commitment
   * Returns true if working in a project that aligns with commitment
   */
  hasMatchingProject(commitmentKeywords: string[]): boolean {
    for (const projectDir of this.projectDirs.keys()) {
      const dirLower = projectDir.toLowerCase()
      if (commitmentKeywords.some((kw) => dirLower.includes(kw.toLowerCase()))) {
        return true
      }
    }
    return false
  }

  /**
   * Get most recent activity time
   */
  private getLastActivityTime(): Date | null {
    let latest: Date | null = null

    for (const time of this.recentFiles.values()) {
      if (!latest || time > latest) {
        latest = time
      }
    }

    for (const time of this.recentCommands.values()) {
      if (!latest || time > latest) {
        latest = time
      }
    }

    return latest
  }

  /**
   * Remove entries older than TTL
   */
  private cleanupOldEntries(): void {
    const cutoff = new Date(Date.now() - this.CONTEXT_TTL_MS)

    // Clean up files
    for (const [file, time] of this.recentFiles.entries()) {
      if (time < cutoff) {
        this.recentFiles.delete(file)
      }
    }

    // Clean up commands
    for (const [cmd, time] of this.recentCommands.entries()) {
      if (time < cutoff) {
        this.recentCommands.delete(cmd)
      }
    }

    // Clean up project directories
    for (const [dir, time] of this.projectDirs.entries()) {
      if (time < cutoff) {
        this.projectDirs.delete(dir)
      }
    }
  }

  /**
   * Clear all context
   */
  clear(): void {
    this.recentFiles.clear()
    this.recentCommands.clear()
    this.projectDirs.clear()
  }
}
