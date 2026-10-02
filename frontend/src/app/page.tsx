import { ConnectionStatus } from "../components/connection-status";
import Link from "next/link";

export default function Home() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <aside className="sidebar" aria-label="Workbench overview">
        <Link className="brand" href="/" aria-label="Coding Round home">
          <span className="brand-symbol" aria-hidden="true">
            c<span>r</span>
          </span>
          <span>
            Coding Round
            <span className="brand-caption">THE PRACTICE WORKBENCH</span>
          </span>
        </Link>
        <div className="sidebar-section">WORKSPACE</div>
        <nav aria-label="Main navigation">
          <Link href="/" className="nav-current" aria-current="page">
            <span aria-hidden="true">▦</span> Overview{" "}
            <span className="nav-indicator" />
          </Link>
        </nav>
        <div className="sidebar-note">
          <span className="note-icon" aria-hidden="true">
            ⌘
          </span>
          <strong>Real work. Better habits.</strong>
          <p>
            A space to practice investigating code and working thoughtfully with
            AI.
          </p>
        </div>
        <div className="sidebar-footer">
          <span className="status-dot ready" />
          Local-first <span>Foundation / 01</span>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div>
            Workspace <span>/</span> <strong>Overview</strong>
          </div>
          <span className="build-tag">FOUNDATION BUILD</span>
        </header>
        <main id="workspace" tabIndex={-1}>
          <div className="page-intro">
            <p className="eyebrow">YOUR PRACTICE SPACE</p>
            <h1>Good practice starts here.</h1>
            <p>
              Investigate real code. Question the suggestion. Verify the fix.
            </p>
          </div>

          <div className="overview-grid">
            <section
              className="practice-card"
              aria-labelledby="practice-heading"
            >
              <div className="card-heading">
                <span className="eyebrow">PRACTICE WORKBENCH</span>
                <span className="pill">Spring Boot first</span>
              </div>
              <div className="code-motif" aria-hidden="true">
                <div className="motif-window">
                  <div className="motif-dots">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="motif-code">
                    <span>{"{ "}</span>
                    <div>
                      <b />
                      <b />
                      <b />
                    </div>
                    <span>{" }"}</span>
                  </div>
                </div>
                <span className="motif-check">✓</span>
              </div>
              <h2 id="practice-heading">Your first case is still ahead.</h2>
              <p>
                The workbench is taking shape. Practice will begin here once the
                first verified scenario is available.
              </p>
              <div className="empty-note">
                <span aria-hidden="true">◇</span> No practice scenarios
                available yet
              </div>
              <div className="practice-footer">
                <span>PLANNED FIRST STACK</span>
                <strong>
                  Java <span>/</span> Spring Boot
                </strong>
              </div>
            </section>

            <div className="right-column">
              <ConnectionStatus />
              <section className="scope-card" aria-labelledby="scope-heading">
                <span className="eyebrow">WHERE WE ARE</span>
                <h2 id="scope-heading">The foundation is in place.</h2>
                <p>
                  This build connects the app to its local backend and storage.
                  Practice sessions, the IDE, and AI assistance are still to
                  come.
                </p>
                <div className="scope-footer">
                  <span className="tiny-square" />
                  Built one feature at a time
                </div>
              </section>
            </div>
          </div>

          <section
            className="practice-principles"
            aria-labelledby="principles-heading"
          >
            <div className="section-heading">
              <h2 id="principles-heading">What we’re building toward</h2>
              <span>THE PRACTICE LOOP</span>
            </div>
            <div className="principles-grid">
              <article>
                <span className="step-number">01</span>
                <h3>Investigate the unfamiliar</h3>
                <p>
                  A real codebase, an incident to untangle, and a history worth
                  exploring.
                </p>
              </article>
              <article>
                <span className="step-number">02</span>
                <h3>Work with AI, thoughtfully</h3>
                <p>
                  Ask focused questions. Challenge assumptions. Make the
                  decisions yourself.
                </p>
              </article>
              <article>
                <span className="step-number">03</span>
                <h3>Prove the fix holds</h3>
                <p>
                  Run the checks, look for regressions, and learn from how you
                  got there.
                </p>
              </article>
            </div>
          </section>
          <footer className="page-footer">
            <span>Your workspace. Your pace.</span>
            <span>Designed for deliberate practice.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
