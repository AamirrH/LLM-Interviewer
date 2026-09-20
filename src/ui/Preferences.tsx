import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { localStore } from '../store/storage'
import { settingsSchema, type Settings } from '../store/schema'
import { Feedback, type Notice } from './Feedback'

export function Preferences({
  settings,
  onChange,
}: {
  settings: Settings
  onChange: () => Promise<void>
}) {
  const [draft, setDraft] = useState(settings)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings)

  async function save() {
    setBusy(true)
    setNotice(null)
    try {
      await localStore.saveSettings(draft)
      await onChange()
      setNotice({ kind: 'success', text: 'Preferences saved on this browser.' })
    } catch {
      setNotice({
        kind: 'error',
        text: 'Could not save preferences. Check browser storage permissions and try again.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="section-heading">
        <div>
          <h2>A space that feels like yours.</h2>
          <p>Small adjustments for more focused practice.</p>
        </div>
        <SlidersHorizontal size={23} />
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void save()
        }}
      >
        <section className="panel">
          <div className="panel-title">
            <h3>Appearance</h3>
            <p>Make yourself comfortable.</p>
          </div>
          <div className="field-row">
            <div>
              <label htmlFor="theme">Color theme</label>
              <p>Choose a look, or follow your device.</p>
            </div>
            <select
              id="theme"
              value={draft.theme}
              disabled={busy}
              onChange={(event) =>
                setDraft({ ...draft, theme: settingsSchema.shape.theme.parse(event.target.value) })
              }
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">Use system setting</option>
            </select>
          </div>
        </section>
        <section className="panel">
          <div className="panel-title">
            <h3>Editor defaults</h3>
            <p>Saved for the code editor when it becomes available.</p>
          </div>
          <div className="field-row">
            <div>
              <label htmlFor="language">Preferred language</label>
              <p>Your starting language for coding rounds.</p>
            </div>
            <select
              id="language"
              value={draft.language}
              disabled={busy}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  language: settingsSchema.shape.language.parse(event.target.value),
                })
              }
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>
          <div className="field-row">
            <div>
              <label htmlFor="font-size">Editor font size</label>
              <p>A little more room to read your code.</p>
            </div>
            <select
              id="font-size"
              value={draft.fontSize}
              disabled={busy}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  fontSize: settingsSchema.shape.fontSize.parse(Number(event.target.value)),
                })
              }
            >
              <option value="14">14 px</option>
              <option value="16">16 px</option>
              <option value="18">18 px</option>
            </select>
          </div>
          <div className="field-row">
            <div>
              <label htmlFor="autocomplete">Enable autocomplete and snippets</label>
              <p>Off by default for a more realistic interview.</p>
            </div>
            <input
              className="switch"
              type="checkbox"
              id="autocomplete"
              checked={draft.autocomplete}
              disabled={busy}
              onChange={(event) => setDraft({ ...draft, autocomplete: event.target.checked })}
            />
          </div>
        </section>
        <div className="save-row">
          <span>
            {dirty ? 'You have unsaved changes.' : 'Changes are saved on this browser only.'}
          </span>
          <button className="button primary" disabled={busy || !dirty}>
            {busy ? 'Saving…' : 'Save preferences'}
          </button>
        </div>
      </form>
      <Feedback notice={notice} />
    </>
  )
}
