/**
 * Commitment matcher - determines if activity aligns with daily commitment
 * Uses semantic analysis (AI-powered) or fallback to keyword matching
 */

import type { ActivitySnapshot, CommitmentAlignment } from '../../types/activity.js'
import { AlignmentAnalyzer } from '../analysis/AlignmentAnalyzer.js'
import type { CommitmentStore } from '../../state/CommitmentStore.js'
import type { UserProfile } from '../../types/state.js'
import type { WorkContextTracker } from '../context/WorkContextTracker.js'

interface CacheEntry {
  alignment: CommitmentAlignment
  timestamp: number
}

export class CommitmentMatcher {
  private cache: Map<string, CacheEntry> = new Map()
  private readonly CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
  private alignmentAnalyzer: AlignmentAnalyzer | null = null

  constructor(
    private commitmentStore?: CommitmentStore,
    private profile?: UserProfile,
    private contextTracker?: WorkContextTracker
  ) {
    // AlignmentAnalyzer will be created lazily when needed
  }

  /**
   * Initialize analyzer (lazy initialization)
   *
   * NOTE: AlignmentAnalyzer is designed for hook requests (coding tasks with git context),
   * not for real-time app activity monitoring. For now, we use keyword-based alignment
   * which is faster and more appropriate for this use case.
   */
  private getAnalyzer(): AlignmentAnalyzer | null {
    // Disable AI analysis for app watcher activities
    // Use keyword-based alignment instead (faster and more appropriate)
    return null
  }

  /**
   * Check if activity aligns with commitment
   */
  async checkAlignment(
    activity: ActivitySnapshot,
    commitment: string
  ): Promise<CommitmentAlignment> {
    // Check cache first
    const cacheKey = this.getCacheKey(activity, commitment)
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.alignment
    }

    // Extract context from activity
    const context = this.extractContext(activity)

    const analyzer = this.getAnalyzer()

    if (!analyzer) {
      // No analyzer available, use keyword matching
      return this.keywordBasedAlignment(activity, commitment)
    }

    try {
      // Use AI-powered alignment analysis
      const result = await analyzer.analyze({
        prompt: context.description,
        commitment,
      } as any)

      const alignment = this.mapAnalysisResult(result)

      // Cache result
      this.cache.set(cacheKey, {
        alignment,
        timestamp: Date.now(),
      })

      return alignment
    } catch (error) {
      // Fallback to keyword matching if AI fails
      console.warn('AI alignment failed, using keyword fallback:', error)
      return this.keywordBasedAlignment(activity, commitment)
    }
  }

  /**
   * Categorize activity based on app and window title
   */
  categorizeActivity(
    activity: ActivitySnapshot
  ): 'coding' | 'planning' | 'research' | 'communication' | 'other' {
    const app = activity.app.toLowerCase()
    const window = activity.windowTitle.toLowerCase()

    // Coding
    if (
      app.includes('code') ||
      app.includes('vim') ||
      app.includes('sublime') ||
      app.includes('intellij') ||
      app.includes('xcode') ||
      window.includes('.ts') ||
      window.includes('.js') ||
      window.includes('.py') ||
      window.includes('.java') ||
      window.includes('.go')
    ) {
      return 'coding'
    }

    // Planning
    if (
      app.includes('notion') ||
      app.includes('obsidian') ||
      app.includes('roam') ||
      (app.includes('notes') && (window.includes('plan') || window.includes('todo')))
    ) {
      return 'planning'
    }

    // Research
    if (
      (app.includes('chrome') || app.includes('safari') || app.includes('firefox')) &&
      (activity.url?.includes('stackoverflow') ||
        activity.url?.includes('github.com') ||
        activity.url?.includes('docs.') ||
        window.includes('documentation'))
    ) {
      return 'research'
    }

    // Communication
    if (
      app.includes('slack') ||
      app.includes('mail') ||
      app.includes('zoom') ||
      app.includes('teams')
    ) {
      return 'communication'
    }

    return 'other'
  }

  /**
   * Extract semantic context from activity
   */
  private extractContext(activity: ActivitySnapshot): { description: string } {
    let description = `App: ${activity.app}`

    if (activity.windowTitle) {
      description += `\nWindow: ${activity.windowTitle}`
    }

    if (activity.url) {
      description += `\nURL: ${activity.url}`
    }

    return { description }
  }

  /**
   * Map AlignmentAnalyzer result to CommitmentAlignment
   */
  private mapAnalysisResult(result: any): CommitmentAlignment {
    if (result.isAligned) {
      return {
        isAligned: true,
        alignment: 'on_track',
        confidence: result.confidence || 0.8,
        reasoning: result.reasoning || 'Activity matches commitment',
      }
    } else if (result.isProductiveProcrastination || result.seemsProductive) {
      return {
        isAligned: false,
        alignment: 'productive_procrastination',
        confidence: result.confidence || 0.7,
        reasoning:
          result.reasoning || 'Activity is productive but not aligned with main commitment',
      }
    } else {
      return {
        isAligned: false,
        alignment: 'off_track',
        confidence: result.confidence || 0.8,
        reasoning: result.reasoning || 'Activity does not match commitment',
      }
    }
  }

  /**
   * Fallback keyword-based alignment (when AI unavailable)
   */
  private keywordBasedAlignment(
    activity: ActivitySnapshot,
    commitment: string
  ): CommitmentAlignment {
    // Special handling for development tools - check if recent work matches commitment
    if (this.isDevelopmentTool(activity.app)) {
      // If we have context tracker, check if recent files/projects match commitment
      if (this.contextTracker) {
        const keywords = this.extractKeywords(commitment)
        const hasRelevantWork = this.contextTracker.hasRelevantActivity(keywords)
        const hasMatchingProject = this.contextTracker.hasMatchingProject(keywords)

        if (hasRelevantWork && hasMatchingProject) {
          return {
            isAligned: true,
            alignment: 'on_track',
            confidence: 0.95,
            reasoning: 'Development tool + project and recent work match commitment',
          }
        }

        if (hasRelevantWork) {
          return {
            isAligned: true,
            alignment: 'on_track',
            confidence: 0.85,
            reasoning: 'Development tool + recent work matches commitment',
          }
        }

        // Has context but no matching work - likely wrong project
        if (this.contextTracker.getContext().projectDirectories.length > 0) {
          const currentProjects = this.contextTracker.getContext().projectDirectories.join(', ')
          return {
            isAligned: false,
            alignment: 'productive_procrastination',
            confidence: 0.8,
            reasoning: `Working on different project(s): ${currentProjects}`,
          }
        }
      }

      // No context or no project info - assume on_track but lower confidence
      return {
        isAligned: true,
        alignment: 'on_track',
        confidence: 0.6,
        reasoning: 'Development tool - assumed on_track (no context available)',
      }
    }

    const commitmentKeywords = this.extractKeywords(commitment)
    const activityText =
      `${activity.app} ${activity.windowTitle} ${activity.url || ''}`.toLowerCase()

    const matches = commitmentKeywords.filter((kw) => activityText.includes(kw.toLowerCase()))

    const matchRatio = matches.length / Math.max(commitmentKeywords.length, 1)

    if (matchRatio > 0.5) {
      return {
        isAligned: true,
        alignment: 'on_track',
        confidence: matchRatio,
        reasoning: `Matched keywords: ${matches.join(', ')}`,
      }
    } else if (matchRatio > 0.2) {
      return {
        isAligned: false,
        alignment: 'productive_procrastination',
        confidence: 0.5,
        reasoning: `Partial keyword matches: ${matches.join(', ')}`,
      }
    } else {
      return {
        isAligned: false,
        alignment: 'off_track',
        confidence: 1 - matchRatio,
        reasoning: 'No significant keyword matches found',
      }
    }
  }

  /**
   * Check if app is a development/work tool
   * These apps often don't expose window/tab titles, so we trust they're work-related
   */
  private isDevelopmentTool(app: string): boolean {
    const devTools = [
      'code', // VS Code
      'cursor', // Cursor
      'stable', // Cursor stable
      'warp', // Warp terminal
      'iterm', // iTerm2
      'terminal', // macOS Terminal
      'vim',
      'neovim',
      'sublime',
      'intellij',
      'pycharm',
      'webstorm',
      'datagrip',
      'docker',
      'postman',
      'insomnia',
      'tableplus',
      'sequel',
      'figma', // Design tool
    ]

    const appLower = app.toLowerCase()
    return devTools.some((tool) => appLower.includes(tool))
  }

  /**
   * Extract keywords from commitment text
   */
  private extractKeywords(text: string): string[] {
    // Remove common stop words and extract meaningful keywords
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
    ])

    return text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))
  }

  /**
   * Generate cache key for activity + commitment pair
   */
  private getCacheKey(activity: ActivitySnapshot, commitment: string): string {
    return `${activity.app}|${activity.windowTitle}|${commitment}`
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL_MS) {
        this.cache.delete(key)
      }
    }
  }
}
