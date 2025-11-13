import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { Profile } from './types.js'
import os from 'os'

export class ProfileManager {
  private configDir: string
  private configPath: string

  constructor() {
    this.configDir = path.join(os.homedir(), '.footnote')
    this.configPath = path.join(this.configDir, 'config.yaml')
  }

  async loadProfile(): Promise<Profile> {
    this.ensureConfigDir()

    if (!fs.existsSync(this.configPath)) {
      throw new Error('No profile found. Run: footnote init')
    }

    const content = fs.readFileSync(this.configPath, 'utf8')
    const profile = yaml.load(content) as Profile

    this.validateProfile(profile)
    return profile
  }

  async saveProfile(profile: Profile): Promise<void> {
    this.ensureConfigDir()
    this.validateProfile(profile)

    const yamlContent = yaml.dump(profile)
    fs.writeFileSync(this.configPath, yamlContent, 'utf8')
  }

  profileExists(): boolean {
    return fs.existsSync(this.configPath)
  }

  private ensureConfigDir(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true })
    }
  }

  private validateProfile(profile: Profile): void {
    if (!profile.name || typeof profile.name !== 'string') {
      throw new Error('Profile must have a name')
    }

    if (!profile.schedule || !profile.schedule.work_hours) {
      throw new Error('Profile must have schedule.work_hours')
    }

    if (!this.validateSchedule(profile.schedule.work_hours)) {
      throw new Error('Invalid work_hours format. Use "9am-3pm" or "20:00-02:00"')
    }

    if (!Array.isArray(profile.priorities) || profile.priorities.length === 0) {
      throw new Error('Profile must have at least one priority')
    }
  }

  validateSchedule(workHours: string): boolean {
    // Parse "9am-3pm" or "20:00-02:00"
    const parts = workHours.split('-')
    if (parts.length !== 2) return false

    const [start, end] = parts
    return this.isValidTime(start.trim()) && this.isValidTime(end.trim())
  }

  private isValidTime(time: string): boolean {
    // Match "9am", "3:45pm", "20:00", "02:00"
    const timeRegex = /^(\d{1,2})(:\d{2})?(am|pm)?$/i
    return timeRegex.test(time)
  }

  getConfigDir(): string {
    return this.configDir
  }
}
