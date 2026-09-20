import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AppDatabase, LocalStore } from './storage'
import { DEFAULT_SETTINGS, parseBackup } from './schema'

let database: AppDatabase
let store: LocalStore

beforeEach(() => {
  database = new AppDatabase(`test-${crypto.randomUUID()}`)
  store = new LocalStore(database)
})
afterEach(async () => { await database.delete() })

describe('local settings and credentials', () => {
  it('starts private with conservative defaults and no saved records', async () => {
    expect(await store.getSettings()).toEqual(DEFAULT_SETTINGS)
    expect((await store.getSettings()).autocomplete).toBe(false)
    expect(await store.getKeys()).toEqual([])
    expect(await database.settings.count()).toBe(0)
  })

  it('persists preferences and keys across database connections', async () => {
    await store.saveSettings({ ...DEFAULT_SETTINGS, theme: 'light', fontSize: 18 })
    await store.saveKey('gemini', '  fake-key-for-tests  ')
    database.close()
    const reopened = new AppDatabase(database.name)
    const nextStore = new LocalStore(reopened)
    expect(await nextStore.getSettings()).toMatchObject({ theme: 'light', fontSize: 18 })
    expect(await nextStore.getKeys()).toEqual([{ provider: 'gemini', key: 'fake-key-for-tests' }])
    reopened.close()
  })

  it('rejects invalid settings and blank keys without changing existing data', async () => {
    await store.saveSettings({ ...DEFAULT_SETTINGS, theme: 'light' })
    await expect(store.saveSettings({ ...DEFAULT_SETTINGS, fontSize: 999 })).rejects.toThrow()
    await expect(store.saveKey('gemini', '  ')).rejects.toThrow()
    expect(await store.getSettings()).toMatchObject({ theme: 'light', fontSize: 16 })
    expect(await store.getKeys()).toEqual([])
  })

  it('removes only the selected provider credential', async () => {
    await store.saveKey('gemini', 'first')
    await store.saveKey('groq', 'second')
    await store.removeKey('gemini')
    expect(await store.getKeys()).toEqual([{ provider: 'groq', key: 'second' }])
  })
})

describe('portable backups', () => {
  it('round-trips preferences without exporting or replacing credentials', async () => {
    await store.saveSettings({ ...DEFAULT_SETTINGS, theme: 'light', autocomplete: true })
    await store.saveKey('groq', 'never-export-this')
    const backup = await store.exportBackup()
    expect(JSON.stringify(backup)).not.toContain('never-export-this')
    expect(backup).not.toHaveProperty('keys')
    await store.saveSettings(DEFAULT_SETTINGS)
    await store.importBackup(JSON.stringify(backup))
    expect(await store.getSettings()).toMatchObject({ theme: 'light', autocomplete: true })
    expect(await store.getKeys()).toEqual([{ provider: 'groq', key: 'never-export-this' }])
  })

  it.each([
    ['corrupt JSON', '{oops'],
    ['unknown format', JSON.stringify({ app: 'some-other-app' })],
    ['future version', JSON.stringify({ app: 'llm-interviewer', version: 999 })],
  ])('rejects %s without modifying stored settings', async (_, text) => {
    await store.saveSettings({ ...DEFAULT_SETTINGS, theme: 'light' })
    await expect(store.importBackup(text)).rejects.toThrow('Invalid backup')
    expect(await store.getSettings()).toMatchObject({ theme: 'light' })
  })

  it('rejects injected credential fields and malformed preference values', async () => {
    const backup = await store.exportBackup()
    expect(() => parseBackup(JSON.stringify({ ...backup, keys: [{ key: 'unsafe' }] }))).toThrow('Invalid backup')
    expect(() => parseBackup(JSON.stringify({ ...backup, settings: { ...DEFAULT_SETTINGS, theme: 'neon' } }))).toThrow('Invalid backup')
  })

  it('caps backup size before parsing', () => {
    expect(() => parseBackup(' '.repeat(1_048_577))).toThrow('1 MB')
  })
})

describe('delete all data', () => {
  it('clears every table and restores unsaved defaults', async () => {
    await store.saveSettings({ ...DEFAULT_SETTINGS, theme: 'light' })
    await store.saveKey('gemini', 'first')
    await store.saveKey('groq', 'second')
    await store.deleteAll()
    for (const table of database.tables) expect(await table.count()).toBe(0)
    expect(await store.getSettings()).toEqual(DEFAULT_SETTINGS)
    expect(await store.getKeys()).toEqual([])
  })
})
