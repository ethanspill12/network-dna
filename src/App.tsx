import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { uploadCapture } from './api/captureApi'
import { NetworkObservation } from './components/NetworkObservation'
import { AttackLab } from './components/attackLab/AttackLab'
import { C2_CONNECTION_ID, c2AttackLabCapture } from './data/attackLabCapture'
import { adaptCapture } from './data/captureAdapter'
import type { NetworkCapture } from './types/network'

const loadNetworkDnaView = () => import('./components/dna/NetworkDnaView')
const NetworkDnaView = lazy(() =>
  loadNetworkDnaView().then((module) => ({ default: module.NetworkDnaView })),
)

function App() {
  const [view, setView] = useState<'landing' | 'processing' | 'observation' | 'dna-transitioning' | 'dna' | 'attack-lab' | 'attack-dna'>('landing')
  const [capture, setCapture] = useState<NetworkCapture | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processingStage, setProcessingStage] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadCapture = () => {
    if (view !== 'landing') return
    fileInputRef.current?.click()
  }

  const processCapture = async (file: File) => {
    if (!/\.(pcap|pcapng)$/i.test(file.name)) {
      setError('Choose a .pcap or .pcapng capture file.')
      return
    }
    setError(null)
    setProcessingStage(0)
    setView('processing')
    try {
      const result = adaptCapture(await uploadCapture(file))
      setCapture(result)
      void loadNetworkDnaView()
      setProcessingStage(3)
      window.setTimeout(() => setView('observation'), 480)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The capture could not be processed.')
      setView('landing')
    }
  }

  useEffect(() => {
    if (view !== 'processing') return
    const timer = window.setInterval(() => {
      setProcessingStage((stage) => stage >= 3 ? 3 : Math.min(stage + 1, 2))
    }, 1150)
    return () => window.clearInterval(timer)
  }, [view])

  const generateDna = () => {
    if (view !== 'observation') return
    setView('dna-transitioning')
    window.setTimeout(() => setView('dna'), 2350)
  }

  if (view === 'attack-lab') {
    return (
      <AttackLab
        onExit={() => setView('landing')}
        onStartC2={() => {
          void loadNetworkDnaView()
          setView('attack-dna')
        }}
      />
    )
  }

  if (view === 'attack-dna') {
    return (
      <Suspense fallback={<main className="dna-view" aria-label="Loading Attack Lab simulation" />}>
        <NetworkDnaView
          capture={c2AttackLabCapture}
          attackLab={{ targetConnectionId: C2_CONNECTION_ID }}
          onBack={() => setView('attack-lab')}
        />
      </Suspense>
    )
  }

  if (view === 'observation' && capture) {
    return <NetworkObservation capture={capture} onGenerate={generateDna} />
  }

  if ((view === 'dna-transitioning' || view === 'dna') && capture) {
    const isHandoff = view === 'dna-transitioning'
    return (
      <div className={`dna-experience ${isHandoff ? 'dna-experience--handoff' : ''}`}>
        <Suspense fallback={<main className="dna-view dna-view--seamless" aria-label="Loading Network DNA" />}>
          <NetworkDnaView
            capture={capture}
            isHandoff={isHandoff}
            seamlessEntry
            onBack={() => setView('observation')}
          />
        </Suspense>
        {isHandoff && <NetworkObservation capture={capture} onGenerate={generateDna} isTransforming />}
      </div>
    )
  }

  return (
    <main className={`landing ${view === 'processing' ? 'landing--processing' : ''}`}>
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

        <input
          ref={fileInputRef}
          className="capture-input"
          type="file"
          accept=".pcap,.pcapng,application/vnd.tcpdump.pcap"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void processCapture(file)
          }}
        />
        <button className="load-button" type="button" onClick={loadCapture} disabled={view === 'processing'}>
          <span>LOAD CAPTURE</span>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10 3v10m0 0 4-4m-4 4-4-4M4 16h12" />
          </svg>
        </button>
        <button className="attack-lab-entry" type="button" onClick={() => setView('attack-lab')} disabled={view === 'processing'}>
          <span>ATTACK LAB</span><small>SAFE SIMULATION</small>
        </button>
        {error && <div className="capture-error" role="alert"><span>CAPTURE ERROR</span>{error}</div>}
        {view === 'processing' && (
          <div className="capture-processing" role="status" aria-live="polite">
            <span className="processing-orbit" aria-hidden="true"><i /></span>
            <div>
              <small>LOCAL ANALYSIS IN PROGRESS</small>
              <strong>{['READING CAPTURE', 'DECODING PACKETS', 'RECONSTRUCTING CONNECTIONS', 'BUILDING NETWORK'][processingStage]}</strong>
              <span className="processing-line"><i /></span>
            </div>
          </div>
        )}
      </section>

      <footer className="site-footer" aria-hidden="true">
        <span>TRAFFIC / STRUCTURE / INSIGHT</span>
        <span className="coordinates">40.7128° N&nbsp;&nbsp; 74.0060° W</span>
      </footer>
    </main>
  )
}

export default App
