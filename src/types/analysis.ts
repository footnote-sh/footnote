/**
 * Analysis result types
 */

export interface AnalysisResult {
  aligned: boolean
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  type: AnalysisType
  reasoning: string
  confidence: number // 0-1
}

export type AnalysisType =
  | 'aligned' // Request matches commitment
  | 'shiny_object' // Completely different exciting idea
  | 'context_switch' // Related but off-track
  | 'enhancement' // Enhancement to main task
  | 'productive_procrastination' // Planning/research instead of doing

export interface AnalysisContext {
  commitment: string
  request: string
  context?: {
    current_file?: string
    git_branch?: string
    recent_commits?: string[]
  }
}
