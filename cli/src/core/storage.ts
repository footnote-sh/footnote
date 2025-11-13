import fs from 'fs'
import path from 'path'
import initSqlJs, { Database } from 'sql.js'
import { Commitment, Footnote, Intervention } from './types.js'
import os from 'os'
import { format } from 'date-fns'

export class Storage {
  private db: Database | null = null
  private dataDir: string
  private dbPath: string
  private dailyLogPath: string
  private footnotesPath: string

  constructor() {
    this.dataDir = path.join(os.homedir(), '.footnote')
    this.dbPath = path.join(this.dataDir, 'local.db')
    this.dailyLogPath = path.join(this.dataDir, 'daily-log.md')
    this.footnotesPath = path.join(this.dataDir, 'footnotes.md')
  }

  async initialize(): Promise<void> {
    this.ensureDataDir()

    const SQL = await initSqlJs()

    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath)
      this.db = new SQL.Database(buffer)
    } else {
      this.db = new SQL.Database()
      this.initializeSchema()
      this.saveDatabase()
    }
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true })
    }

    // Initialize markdown files if they don't exist
    if (!fs.existsSync(this.dailyLogPath)) {
      fs.writeFileSync(this.dailyLogPath, '# Daily Log\n\n', 'utf8')
    }

    if (!fs.existsSync(this.footnotesPath)) {
      fs.writeFileSync(this.footnotesPath, '# Footnotes\n\n', 'utf8')
    }
  }

  private initializeSchema(): void {
    if (!this.db) throw new Error('Database not initialized')

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS commitments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        main_thought TEXT NOT NULL,
        footnotes TEXT,
        completed INTEGER DEFAULT 0,
        completion_time TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS footnotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        captured_at TEXT NOT NULL,
        reviewed INTEGER DEFAULT 0,
        promoted_to_task INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS interventions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        triggered_at TEXT NOT NULL,
        context TEXT,
        action TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)
  }

  private saveDatabase(): void {
    if (!this.db) throw new Error('Database not initialized')
    const data = this.db.export()
    fs.writeFileSync(this.dbPath, data)
  }

  saveCommitment(commitment: Omit<Commitment, 'id' | 'created_at'>): void {
    if (!this.db) throw new Error('Database not initialized')

    const stmt = this.db.prepare(`
      INSERT INTO commitments (date, main_thought, footnotes, completed, completion_time)
      VALUES (?, ?, ?, ?, ?)
    `)

    stmt.run([
      commitment.date,
      commitment.main_thought,
      JSON.stringify(commitment.footnotes),
      commitment.completed ? 1 : 0,
      commitment.completion_time,
    ])

    stmt.free()
    this.saveDatabase()
  }

  getTodayCommitment(): Commitment | null {
    if (!this.db) throw new Error('Database not initialized')

    const today = format(new Date(), 'yyyy-MM-dd')
    const stmt = this.db.prepare(`
      SELECT * FROM commitments WHERE date = ? ORDER BY created_at DESC LIMIT 1
    `)

    stmt.bind([today])
    if (stmt.step()) {
      const row = stmt.getAsObject() as any
      stmt.free()
      return {
        id: row.id,
        date: row.date,
        main_thought: row.main_thought,
        footnotes: JSON.parse(row.footnotes || '[]'),
        completed: Boolean(row.completed),
        completion_time: row.completion_time,
        created_at: row.created_at,
      }
    }

    stmt.free()
    return null
  }

  saveFootnote(content: string): void {
    if (!this.db) throw new Error('Database not initialized')

    const now = new Date().toISOString()
    const stmt = this.db.prepare(`
      INSERT INTO footnotes (content, captured_at, reviewed, promoted_to_task)
      VALUES (?, ?, 0, 0)
    `)

    stmt.run([content, now])
    stmt.free()
    this.saveDatabase()
  }

  getRecentFootnotes(limit: number): Footnote[] {
    if (!this.db) throw new Error('Database not initialized')

    const stmt = this.db.prepare(`
      SELECT * FROM footnotes ORDER BY created_at DESC LIMIT ?
    `)

    stmt.bind([limit])

    const footnotes: Footnote[] = []
    while (stmt.step()) {
      const row = stmt.getAsObject() as any
      footnotes.push({
        id: row.id,
        content: row.content,
        captured_at: row.captured_at,
        reviewed: Boolean(row.reviewed),
        promoted_to_task: Boolean(row.promoted_to_task),
        created_at: row.created_at,
      })
    }

    stmt.free()
    return footnotes
  }

  saveIntervention(intervention: Omit<Intervention, 'id' | 'created_at'>): void {
    if (!this.db) throw new Error('Database not initialized')

    const stmt = this.db.prepare(`
      INSERT INTO interventions (type, triggered_at, context, action)
      VALUES (?, ?, ?, ?)
    `)

    stmt.run([
      intervention.type,
      intervention.triggered_at,
      intervention.context,
      intervention.action,
    ])

    stmt.free()
    this.saveDatabase()
  }

  appendToDailyLog(date: string, mainThought: string, footnotes: string[]): void {
    const entry = `\n## ${date}\n\n**Main thought**: ${mainThought}\n`
    let fullEntry = entry

    if (footnotes.length > 0) {
      fullEntry += `\n**Footnotes**:\n${footnotes.map((f) => `- ${f}`).join('\n')}\n`
    }

    fs.appendFileSync(this.dailyLogPath, fullEntry, 'utf8')
  }

  appendToFootnotes(content: string, timestamp: string): void {
    const entry = `\n- [${timestamp}] ${content}`
    fs.appendFileSync(this.footnotesPath, entry, 'utf8')
  }

  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}
