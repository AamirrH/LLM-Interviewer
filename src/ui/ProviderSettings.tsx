import { useState } from 'react'
import { ArrowUpRight, Check, Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react'
import { localStore } from '../store/storage'
import type { ProviderId } from '../store/schema'
import { Feedback, type Notice } from './Feedback'

const providers: {
  id: ProviderId
  name: string
  initial: string
  description: string
  url: string
}[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    initial: 'G',
    description: 'Google’s family of language models.',
    url: 'https://aistudio.google.com/apikey',
  },
  {
    id: 'groq',
    name: 'Groq',
    initial: 'g',
    description: 'Fast inference for open language models.',
    url: 'https://console.groq.com/keys',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    initial: '↗',
    description: 'Multiple model providers, one API key.',
    url: 'https://openrouter.ai/settings/keys',
  },
]

function ProviderCard({
  provider,
  saved,
  onChange,
}: {
  provider: (typeof providers)[number]
  saved: boolean
  onChange: () => Promise<void>
}) {
  const [key, setKey] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)

  async function mutate(remove: boolean) {
    setBusy(true)
    setNotice(null)
    try {
      if (remove) await localStore.removeKey(provider.id)
      else await localStore.saveKey(provider.id, key)
      setKey('')
      setRevealed(false)
      await onChange()
      setNotice({
        kind: 'success',
        text: remove
          ? 'Key removed from this browser.'
          : 'Key saved on this browser. Connection not tested.',
      })
    } catch {
      setNotice({
        kind: 'error',
        text: 'Could not save changes. Check browser storage permissions and try again.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="provider-card" aria-label={provider.name}>
      <div className="provider-heading">
        <div className={`provider-mark ${provider.id}`} aria-hidden="true">
          {provider.initial}
        </div>
        <div className="provider-name">
          <h3>{provider.name}</h3>
          <p>{provider.description}</p>
        </div>
        <span className={`badge ${saved ? 'saved' : ''}`}>
          {saved ? <Check size={12} /> : <span className="status-dot" />}
          {saved ? 'Saved locally' : 'No key saved'}
        </span>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void mutate(false)
        }}
      >
        <label htmlFor={`${provider.id}-key`}>{saved ? 'Replace API key' : 'API key'}</label>
        <div className="key-row">
          <div className="secret-input">
            <KeyRound size={16} aria-hidden="true" />
            <input
              id={`${provider.id}-key`}
              aria-label={`${provider.name} API key`}
              type={revealed ? 'text' : 'password'}
              value={key}
              onChange={(event) => setKey(event.target.value)}
              placeholder={
                saved ? 'Enter a new key to replace the saved key' : 'Paste your API key'
              }
              autoComplete="off"
              spellCheck={false}
              maxLength={4096}
              disabled={busy}
            />
            <button
              type="button"
              className="icon-button"
              onClick={() => setRevealed(!revealed)}
              aria-label={revealed ? 'Hide API key' : 'Show API key'}
              aria-pressed={revealed}
            >
              {revealed ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <button className="button secondary" disabled={busy || !key.trim()} type="submit">
            {busy ? 'Saving…' : 'Save key'}
          </button>
        </div>
        <div className="provider-footer">
          <a href={provider.url} target="_blank" rel="noreferrer">
            Get an API key <ArrowUpRight size={13} />
          </a>
          {saved && (
            <button
              className="text-button"
              type="button"
              disabled={busy}
              onClick={() => void mutate(true)}
            >
              Remove key
            </button>
          )}
        </div>
      </form>
      <Feedback notice={notice} />
    </section>
  )
}

export function ProviderSettings({
  savedProviders,
  onChange,
}: {
  savedProviders: ProviderId[]
  onChange: () => Promise<void>
}) {
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>Bring your own intelligence.</h2>
          <p>Save your provider keys for the interviews ahead.</p>
        </div>
        <span className="label-pill">BYOK</span>
      </div>
      <div className="info-strip">
        <LockKeyhole size={17} />
        <p>
          Keys stay in this browser. Saving a key does not send it anywhere or test a connection.
        </p>
      </div>
      <div className="provider-list">
        {providers.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            saved={savedProviders.includes(provider.id)}
            onChange={onChange}
          />
        ))}
      </div>
      <div className="privacy-note">
        <ShieldCheck size={20} />
        <p>
          <strong>Local by default. Yours to control.</strong> Keys are stored unencrypted in
          browser storage. Use a trusted device and restricted keys. Backups never include them.
        </p>
      </div>
    </>
  )
}
