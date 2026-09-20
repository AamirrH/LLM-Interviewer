import Dexie, { type Table } from 'dexie'
import {
  DEFAULT_SETTINGS, credentialSchema, parseBackup, settingsSchema,
  type Backup, type Credential, type ProviderId, type Settings,
} from './schema'

type SettingsRecord = { id: 'preferences'; value: Settings }

export class AppDatabase extends Dexie {
  settings!: Table<SettingsRecord, string>
  credentials!: Table<Credential, ProviderId>

  constructor(name = 'llm-interviewer') {
    super(name)
    this.version(1).stores({ settings: 'id', credentials: 'provider' })
  }
}

export class LocalStore {
  constructor(private readonly database: AppDatabase) {}

  async getSettings(): Promise<Settings> {
    const record = await this.database.settings.get('preferences')
    return record ? settingsSchema.parse(record.value) : { ...DEFAULT_SETTINGS }
  }

  async saveSettings(value: unknown): Promise<void> {
    const settings = settingsSchema.parse(value)
    await this.database.settings.put({ id: 'preferences', value: settings })
  }

  async getKeys(): Promise<Credential[]> {
    return this.database.credentials.toArray()
  }

  async saveKey(provider: ProviderId, key: string): Promise<void> {
    const credential = credentialSchema.parse({ provider, key })
    await this.database.credentials.put(credential)
  }

  async removeKey(provider: ProviderId): Promise<void> {
    await this.database.credentials.delete(provider)
  }

  async exportBackup(): Promise<Backup> {
    return {
      app: 'llm-interviewer', version: 1,
      exportedAt: new Date().toISOString(), settings: await this.getSettings(),
    }
  }

  async importBackup(text: string): Promise<void> {
    const backup = parseBackup(text)
    await this.database.transaction('rw', this.database.settings, async () => {
      await this.database.settings.clear()
      await this.database.settings.put({ id: 'preferences', value: backup.settings })
    })
  }

  async deleteAll(): Promise<void> {
    await this.database.transaction('rw', this.database.tables, async () => {
      for (const table of this.database.tables) await table.clear()
    })
  }
}

export const database = new AppDatabase()
export const localStore = new LocalStore(database)
