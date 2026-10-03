"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type State = "checking" | "ready" | "unavailable";

async function fetchState(signal: AbortSignal): Promise<State> {
  try {
    const response = await fetch("/api/readiness", {
      cache: "no-store",
      signal: AbortSignal.any([signal, AbortSignal.timeout(4000)]),
    });
    const body = await response.json();
    return response.ok && body?.status === "ready" && body?.storage === "ready"
      ? "ready"
      : "unavailable";
  } catch {
    return "unavailable";
  }
}

export function ConnectionStatus() {
  const [state, setState] = useState<State>("checking");
  const active = useRef<AbortController | null>(null);
  const check = useCallback(() => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    void fetchState(controller.signal).then((next) => {
      if (!controller.signal.aborted) setState(next);
    });
  }, []);

  useEffect(() => {
    void check();
    return () => active.current?.abort();
  }, [check]);

  const label =
    state === "checking"
      ? "Checking connection"
      : state === "ready"
        ? "Workbench online"
        : "Connection unavailable";

  return (
    <section className="connection-card" aria-labelledby="connection-heading">
      <div className="card-heading">
        <span className="eyebrow">LOCAL ENVIRONMENT</span>
        <span className="local-mark">On this machine</span>
      </div>
      <div role="status" aria-live="polite" aria-atomic="true">
        <h2 id="connection-heading">
          <span className={`status-dot ${state}`} />
          {label}
        </h2>
        <p className="connection-description">
          {state === "ready"
            ? "Your backend and local storage are connected."
            : state === "checking"
              ? "Contacting your local workbench…"
              : "Start the local backend, then check the connection again."}
        </p>
        <dl className="service-list">
          <div>
            <dt>Application service</dt>
            <dd>
              {state === "ready"
                ? "Connected"
                : state === "checking"
                  ? "Checking…"
                  : "Not verified"}
            </dd>
          </div>
          <div>
            <dt>Local storage</dt>
            <dd>{state === "ready" ? "Ready" : "Not verified"}</dd>
          </div>
        </dl>
      </div>
      <button
        className="secondary-button"
        onClick={() => {
          setState("checking");
          void check();
        }}
        disabled={state === "checking"}
      >
        <span aria-hidden="true">↻</span>{" "}
        {state === "checking" ? "Checking…" : "Check connection"}
      </button>
    </section>
  );
}
