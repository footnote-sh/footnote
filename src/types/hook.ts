/**
 * Hook request/response types
 */

export interface HookRequest {
  request: string // User's AI coding request
  context: HookContext
  source: 'claude-code' | 'gemini' | 'codex' | 'cursor' | 'other'
}

export interface HookContext {
  current_file?: string
  git_branch?: string
  recent_commits?: string[]
  working_directory?: string
  timestamp?: string
}

export interface HookResponse {
  action: 'allow' | 'warn' | 'block'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  type?:
    | 'aligned'
    | 'shiny_object'
    | 'context_switch'
    | 'enhancement'
    | 'productive_procrastination'
  message?: string
  intervention?: Intervention
}

export interface Intervention {
  title: string
  commitment: string
  request: string
  reasoning?: string
  options: InterventionOption[]
  formattedMessage?: string // Fully formatted intervention message with context
}

export interface InterventionOption {
  id: string
  label: string
  description?: string
  action: 'refocus' | 'capture' | 'find_fun' | 'override' | 'timebox'
}

export interface CaptureRequest {
  thought: string
  context?: HookContext
}

export interface CaptureResponse {
  captured: boolean
  message?: string
}
