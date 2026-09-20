import { z } from 'zod'

export const settingsSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']),
  language: z.enum(['python', 'javascript']),
  fontSize: z.union([z.literal(14), z.literal(16), z.literal(18)]),
  autocomplete: z.boolean(),
}).strict()

export type Settings = z.infer<typeof settingsSchema>
export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark', language: 'python', fontSize: 16, autocomplete: false,
}

export const providerSchema = z.enum(['gemini', 'groq', 'openrouter'])
export type ProviderId = z.infer<typeof providerSchema>
export const credentialSchema = z.object({
  provider: providerSchema,
  key: z.string().trim().min(1).max(4096),
}).strict()
export type Credential = z.infer<typeof credentialSchema>

export const backupSchema = z.object({
  app: z.literal('llm-interviewer'),
  version: z.literal(1),
  exportedAt: z.iso.datetime(),
  settings: settingsSchema,
}).strict()
export type Backup = z.infer<typeof backupSchema>
export const MAX_BACKUP_BYTES = 1_048_576

export function parseBackup(text: string): Backup {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) {
    throw new Error('Backup exceeds the 1 MB limit.')
  }
  try {
    return backupSchema.parse(JSON.parse(text))
  } catch {
    throw new Error('Invalid backup. Choose a version 1 LLM Interviewer JSON export.')
  }
}
