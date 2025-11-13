export interface Profile {
  name: string
  description: string
  schedule: {
    work_hours: string
    late_night_alert: string | null
    morning_triage: string
    deep_work_window?: string
  }
  weekly_rhythm?: {
    [key: string]: string
  }
  priorities: string[]
  interventions: {
    late_night_coding: boolean
    shiny_object?: boolean
    completion_gap?: boolean
    wednesday_violation?: boolean
    hyperfocus_alert?: boolean
  }
  integrations: {
    task_manager: 'local' | 'github' | 'linear' | null
    memory: 'episodic' | 'cmem' | null
    calendar: 'gcal' | null
  }
  privacy: {
    analytics: boolean
    cloud_sync: boolean
  }
}

export interface Commitment {
  id?: number
  date: string
  main_thought: string
  footnotes: string[]
  completed: boolean
  completion_time: string | null
  created_at?: string
}

export interface Footnote {
  id?: number
  content: string
  captured_at: string
  reviewed: boolean
  promoted_to_task?: boolean
  created_at?: string
}

export interface Intervention {
  id?: number
  type: string
  triggered_at: string
  context: string
  action: string
  created_at?: string
}

export interface StatusOutput {
  mainThought: string | null
  timeLeft: string | null
  footnotes: number
  completed: boolean
}

export interface FocusOutput {
  date: string
  mainThought: string
  footnotes: string[]
  workHours: string
}

export interface CaptureOutput {
  captured: string
  timestamp: string
  mainThought: string | null
}
