import { useRef, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Database,
  FileJson,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import { localStore } from '../store/storage'
import { MAX_BACKUP_BYTES, parseBackup, type Backup } from '../store/schema'
import { Feedback, type Notice } from './Feedback'

export function DataSettings({ onChange }: { onChange: () => Promise<void> }) {
  const [notice, setNotice] = useState<Notice>(null)
  const [pending, setPending] = useState<{ text: string; backup: Backup } | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  async function exportData() {
    setBusy(true)
    setNotice(null)
    try {
      const backup = await localStore.exportBackup()
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `llm-interviewer-${backup.exportedAt.slice(0, 10)}.json`
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice({ kind: 'success', text: 'Backup downloaded. API keys are excluded.' })
    } catch {
      setNotice({ kind: 'error', text: 'Could not export your data. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  async function selectFile(file?: File) {
    setPending(null)
    setNotice(null)
    if (!file) return
    setBusy(true)
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('Backup exceeds the 1 MB limit.')
      const text = await file.text()
      setPending({ text, backup: parseBackup(text) })
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Could not read this file.',
      })
    } finally {
      if (fileInput.current) fileInput.current.value = ''
      setBusy(false)
    }
  }

  async function restore() {
    if (!pending) return
    setBusy(true)
    setNotice(null)
    try {
      await localStore.importBackup(pending.text)
      await onChange()
      setPending(null)
      setNotice({ kind: 'success', text: 'Backup restored. Your saved API keys were kept.' })
    } catch {
      setNotice({
        kind: 'error',
        text: 'Could not restore this backup. Please check storage permissions and try again.',
      })
    } finally {
      setBusy(false)
    }
  }

  async function deleteData() {
    if (confirmation !== 'DELETE') return
    setBusy(true)
    setNotice(null)
    try {
      await localStore.deleteAll()
      await onChange()
      setPending(null)
      setConfirmation('')
      dialog.current?.close()
      setNotice({
        kind: 'success',
        text: 'All local data deleted. Preferences are back to their defaults.',
      })
    } catch {
      dialog.current?.close()
      setNotice({
        kind: 'error',
        text: 'Could not delete local data. Please check storage permissions and try again.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="section-heading">
        <div>
          <h2>Your practice. Your data.</h2>
          <p>Take it with you, bring it back, or start fresh.</p>
        </div>
        <Database size={23} />
      </div>
      <div className="info-strip">
        <ShieldCheck size={18} />
        <p>Everything saved so far lives in this browser. There is no account or cloud sync.</p>
      </div>
      <section className="panel data-panel">
        <div className="data-icon">
          <ArrowDownToLine size={21} />
        </div>
        <div>
          <h3>Keep a copy</h3>
          <p>Download your preferences as a JSON backup. API keys are always excluded.</p>
          <button className="button secondary" disabled={busy} onClick={() => void exportData()}>
            <ArrowDownToLine size={15} />
            Export backup
          </button>
        </div>
      </section>
      <section className="panel data-panel">
        <div className="data-icon">
          <ArrowUpFromLine size={21} />
        </div>
        <div className="grow">
          <h3>Pick up where you left off</h3>
          <p>
            Restore preferences from a backup. Your current preferences will be replaced; your saved
            keys stay as they are.
          </p>
          <label className={`button secondary file-button ${busy ? 'disabled' : ''}`}>
            <ArrowUpFromLine size={15} />
            Choose backup file
            <input
              ref={fileInput}
              type="file"
              aria-label="Choose backup file"
              accept=".json,application/json"
              disabled={busy}
              onChange={(event) => void selectFile(event.target.files?.[0])}
            />
          </label>
          <span className="file-hint">JSON · up to 1 MB</span>
          {pending && (
            <div className="import-preview">
              <FileJson size={21} />
              <div>
                <strong>Backup ready to restore</strong>
                <p>
                  Exported {new Date(pending.backup.exportedAt).toLocaleDateString()}. Theme:{' '}
                  {pending.backup.settings.theme}; language: {pending.backup.settings.language}.
                </p>
                <div className="button-group">
                  <button className="button primary" disabled={busy} onClick={() => void restore()}>
                    Restore preferences
                  </button>
                  <button className="text-button" disabled={busy} onClick={() => setPending(null)}>
                    Cancel import
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      <section className="panel data-panel danger-panel">
        <div className="data-icon">
          <Trash2 size={21} />
        </div>
        <div>
          <h3>Start with a clean slate</h3>
          <p>
            Permanently delete all app data in this browser, including your preferences and API
            keys. This cannot be undone.
          </p>
          <button
            className="button danger"
            disabled={busy}
            onClick={() => {
              setConfirmation('')
              dialog.current?.showModal()
            }}
          >
            Delete all local data
          </button>
        </div>
      </section>
      <Feedback notice={notice} />
      <dialog
        ref={dialog}
        aria-labelledby="delete-title"
        onCancel={(event) => {
          if (busy) event.preventDefault()
        }}
      >
        <div className="dialog-heading">
          <Trash2 size={24} />
          <button
            className="icon-button"
            aria-label="Close deletion dialog"
            disabled={busy}
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
        <h2 id="delete-title">Delete all local data?</h2>
        <p>
          This removes every saved preference and API key from this browser. Export a backup first
          if you want to keep your preferences.
        </p>
        <label htmlFor="delete-confirmation">Type DELETE to confirm</label>
        <input
          id="delete-confirmation"
          autoComplete="off"
          value={confirmation}
          disabled={busy}
          onChange={(event) => setConfirmation(event.target.value)}
        />
        <div className="dialog-actions">
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => dialog.current?.close()}
          >
            Cancel
          </button>
          <button
            className="button danger"
            disabled={busy || confirmation !== 'DELETE'}
            onClick={() => void deleteData()}
          >
            {busy ? 'Deleting…' : 'Permanently delete data'}
          </button>
        </div>
      </dialog>
    </>
  )
}
