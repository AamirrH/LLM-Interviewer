import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronRight,
  Database,
  KeyRound,
  LockKeyhole,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Terminal,
  WifiOff,
} from 'lucide-react'
import { localStore } from './store/storage'
import type { ProviderId, Settings } from './store/schema'
import { ProviderSettings } from './ui/ProviderSettings'
import { Preferences } from './ui/Preferences'
import { DataSettings } from './ui/DataSettings'
import { useOnline, useRoute } from './ui/useBrowserState'

type Workspace = { settings: Settings; savedProviders: ProviderId[] }
async function readWorkspace(): Promise<Workspace> {
  const [settings, keys] = await Promise.all([localStore.getSettings(), localStore.getKeys()])
  return { settings, savedProviders: keys.map((key) => key.provider) }
}
const tabs = [
  {
    path: '/settings/providers',
    label: 'AI providers',
    icon: KeyRound,
    description: 'Your keys, your choice',
  },
  {
    path: '/settings/preferences',
    label: 'Preferences',
    icon: SlidersHorizontal,
    description: 'Make yourself at home',
  },
  {
    path: '/settings/data',
    label: 'Your data',
    icon: Database,
    description: 'Always in your hands',
  },
]

export function App() {
  const route = useRoute()
  const online = useOnline()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loadError, setLoadError] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const previousRoute = useRef(route)
  const isSettings = route.startsWith('/settings')
  const activeTab = tabs.find((tab) => tab.path === route)
  const knownRoute = route === '/' || route === '/settings' || !!activeTab

  const reload = useCallback(async () => {
    setWorkspace(await readWorkspace())
    setLoadError(false)
  }, [])

  useEffect(() => {
    let active = true
    void readWorkspace().then(
      (value) => {
        if (active) setWorkspace(value)
      },
      () => {
        if (active) setLoadError(true)
      },
    )
    return () => {
      active = false
    }
  }, [])
  useEffect(() => {
    if (!workspace) return
    const query = matchMedia('(prefers-color-scheme: dark)')
    function applyTheme() {
      const theme = workspace!.settings.theme
      document.documentElement.dataset.theme =
        theme === 'system' ? (query.matches ? 'dark' : 'light') : theme
    }
    applyTheme()
    query.addEventListener('change', applyTheme)
    return () => query.removeEventListener('change', applyTheme)
  }, [workspace])
  useEffect(() => {
    document.title = `${isSettings ? 'Settings' : 'Workspace'} · LLM Interviewer`
    if (previousRoute.current !== route) {
      heading.current?.focus()
      previousRoute.current = route
      window.scrollTo(0, 0)
    }
  }, [route, isSettings])

  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          heading.current?.focus()
        }}
      >
        Skip to content
      </a>
      <header className="app-header">
        <div className="header-inner">
          <a href="#/" className="brand" aria-label="LLM Interviewer home">
            <span className="brand-mark">
              <Terminal size={23} strokeWidth={2.4} />
            </span>
            <span>
              LLM<span className="brand-light">Interviewer</span>
            </span>
          </a>
          <nav className="top-nav" aria-label="Main navigation">
            <a href="#/" aria-current={route === '/' ? 'page' : undefined}>
              Workspace
            </a>
            <a href="#/settings/providers" aria-current={isSettings ? 'page' : undefined}>
              <Settings2 size={16} />
              Settings
            </a>
          </nav>
          <div className="local-indicator">
            <span />
            Local workspace
          </div>
        </div>
      </header>
      {!online && (
        <div className="offline-banner">
          <WifiOff size={15} />
          Offline · local settings available
        </div>
      )}
      <main id="main-content" className="main-container">
        {!workspace ? (
          <section className="loading-panel">
            <h1 ref={heading} tabIndex={-1}>
              {loadError ? 'Your storage needs a moment.' : 'Opening your workspace…'}
            </h1>
            {loadError ? (
              <>
                <p role="alert">
                  We couldn’t access browser storage. Allow site data in your browser settings, then
                  try again.
                </p>
                <button
                  className="button primary"
                  onClick={() => {
                    setLoadError(false)
                    void reload().catch(() => setLoadError(true))
                  }}
                >
                  Try again
                </button>
              </>
            ) : (
              <p role="status">Loading your local preferences.</p>
            )}
          </section>
        ) : !knownRoute ? (
          <section className="loading-panel">
            <h1 ref={heading} tabIndex={-1}>
              This page isn’t here.
            </h1>
            <a className="button primary" href="#/">
              Back to workspace
            </a>
          </section>
        ) : isSettings ? (
          <>
            <div className="breadcrumb">
              <a href="#/">Workspace</a>
              <ChevronRight size={12} />
              <span>Settings</span>
            </div>
            <div className="page-heading">
              <div>
                <p className="eyebrow">A LITTLE SETUP GOES A LONG WAY</p>
                <h1 ref={heading} tabIndex={-1}>
                  Your workspace, your rules.
                </h1>
                <p>Set things up once. Keep your attention on getting better.</p>
              </div>
              <span className="page-icon">
                <Settings2 size={28} />
              </span>
            </div>
            <div className="settings-layout">
              <aside>
                <nav className="settings-nav" aria-label="Settings sections">
                  {tabs.map(({ path, label, icon: Icon, description }) => {
                    const active = (activeTab?.path ?? tabs[0]!.path) === path
                    return (
                      <a key={path} href={`#${path}`} aria-label={label} aria-current={active ? 'page' : undefined}>
                        <Icon size={19} />
                        <span>
                          <strong>{label}</strong>
                          <small>{description}</small>
                        </span>
                        {active && <ChevronRight className="nav-chevron" size={15} />}
                      </a>
                    )
                  })}
                </nav>
                <div className="aside-note">
                  <LockKeyhole size={18} />
                  <p>
                    No account. No shared keys.
                    <br />
                    Just your own workspace.
                  </p>
                </div>
              </aside>
              <div className="settings-content" key={activeTab?.path ?? 'providers'}>
                {activeTab?.path === '/settings/preferences' ? (
                  <Preferences settings={workspace.settings} onChange={reload} />
                ) : activeTab?.path === '/settings/data' ? (
                  <DataSettings onChange={reload} />
                ) : (
                  <ProviderSettings savedProviders={workspace.savedProviders} onChange={reload} />
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <section className="welcome">
              <p className="eyebrow">
                <span className="tiny-dot" />
                YOUR PERSONAL PRACTICE SPACE
              </p>
              <h1 ref={heading} tabIndex={-1}>
                Good practice
                <br />
                starts <span>here.</span>
              </h1>
              <p>
                A quieter place to prepare for your next interview.
                <br className="desktop-break" /> Set up your workspace and make it your own.
              </p>
              <a className="button primary large" href="#/settings/providers">
                Set up your workspace
                <ArrowRight size={17} />
              </a>
              <div className="welcome-note">
                <ShieldCheck size={15} />
                Local-first. No account required.
              </div>
              <div className="orbit-art" aria-hidden="true">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <div className="orbit orbit-three" />
                <div className="orbit-center">
                  <Terminal size={58} strokeWidth={1.4} />
                </div>
                <span className="orbit-label label-top">
                  <KeyRound size={15} />
                  Your keys
                </span>
                <span className="orbit-label label-bottom">
                  <Database size={15} />
                  Your data
                </span>
                <i className="orbit-dot" />
              </div>
            </section>
            <section className="workspace-summary">
              <div className="summary-heading">
                <h2>A foundation for focused practice</h2>
                <span className="label-pill">GETTING STARTED</span>
              </div>
              <div className="setup-grid">
                <a className="setup-card" href="#/settings/providers">
                  <KeyRound size={22} />
                  <span className="step-number">01</span>
                  <h3>Bring your AI</h3>
                  <p>Keep your provider keys in your browser, ready when you are.</p>
                  <span className="card-link">
                    {workspace.savedProviders.length
                      ? `${workspace.savedProviders.length} provider key${workspace.savedProviders.length === 1 ? '' : 's'} saved`
                      : 'Add a provider key'}
                    <ArrowRight size={16} />
                  </span>
                </a>
                <a className="setup-card" href="#/settings/preferences">
                  <SlidersHorizontal size={22} />
                  <span className="step-number">02</span>
                  <h3>Find your focus</h3>
                  <p>Choose your theme and set the editor defaults that feel right.</p>
                  <span className="card-link">
                    Customize preferences
                    <ArrowRight size={16} />
                  </span>
                </a>
                <a className="setup-card" href="#/settings/data">
                  <Database size={22} />
                  <span className="step-number">03</span>
                  <h3>Own your progress</h3>
                  <p>Back up your preferences, restore them, or make a fresh start.</p>
                  <span className="card-link">
                    Manage your data
                    <ArrowRight size={16} />
                  </span>
                </a>
              </div>
            </section>
            <div className="build-note">
              <Check size={15} />
              <span>Workspace foundation available.</span> Interview sessions are coming in the next
              feature batches.
            </div>
          </>
        )}
      </main>
      <footer className="app-footer">
        <span>Built for deliberate practice.</span>
        <span>
          <ShieldCheck size={13} />
          Stored on this device<span className="footer-divider">/</span>v0.1
        </span>
      </footer>
    </>
  )
}
