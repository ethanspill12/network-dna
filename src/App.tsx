import { useState } from 'react'
import { NetworkObservation } from './components/NetworkObservation'

function App() {
  const [view, setView] = useState<'landing' | 'transitioning' | 'observation'>('landing')

  const loadCapture = () => {
    if (view !== 'landing') return
    setView('transitioning')
    window.setTimeout(() => setView('observation'), 620)
  }

  if (view === 'observation') {
    return <NetworkObservation />
  }

  return (
    <main className={`landing ${view === 'transitioning' ? 'landing--exiting' : ''}`}>
      <div className="ambient" aria-hidden="true">
        <span className="orb orb--one" />
        <span className="orb orb--two" />
        <span className="signal signal--one" />
        <span className="signal signal--two" />
      </div>

      <header className="site-header">
        <a className="brand" href="/" aria-label="Network DNA home">
          <span className="brand-mark" aria-hidden="true" />
          <span>NETWORK DNA</span>
        </a>
        <div className="status" aria-label="System status: ready">
          <span className="status-dot" aria-hidden="true" />
          SYSTEM READY
        </div>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="eyebrow">
          <span>NETWORK ANALYSIS</span>
          <span className="eyebrow-line" aria-hidden="true" />
          <span>REIMAGINED</span>
        </div>

        <h1 id="hero-title">NETWORK DNA</h1>
        <p className="tagline">Your network has a fingerprint.</p>
        <p className="description">See the structure behind your traffic.</p>

        <button className="load-button" type="button" onClick={loadCapture}>
          <span>LOAD CAPTURE</span>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10 3v10m0 0 4-4m-4 4-4-4M4 16h12" />
          </svg>
        </button>
      </section>

      <footer className="site-footer" aria-hidden="true">
        <span>TRAFFIC / STRUCTURE / INSIGHT</span>
        <span className="coordinates">40.7128° N&nbsp;&nbsp; 74.0060° W</span>
      </footer>
    </main>
  )
}

export default App
