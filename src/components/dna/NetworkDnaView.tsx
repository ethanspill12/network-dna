import { useEffect, useState } from 'react'
import type { NetworkCapture } from '../../types/network'
import { ConnectionDecodePanel } from './ConnectionDecodePanel'
import { DnaScene } from './DnaScene'

interface NetworkDnaViewProps {
  capture: NetworkCapture
  isHandoff?: boolean
  seamlessEntry?: boolean
  onBack: () => void
}

export function NetworkDnaView({ capture, isHandoff = false, seamlessEntry = false, onBack }: NetworkDnaViewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = capture.connections.find((connection) => connection.id === selectedId)

  useEffect(() => {
    document.body.style.cursor = hoveredId ? 'pointer' : ''
    return () => { document.body.style.cursor = '' }
  }, [hoveredId])

  return (
    <main className={`dna-view ${seamlessEntry ? 'dna-view--seamless' : ''} ${isHandoff ? 'dna-view--handoff' : ''}`}>
      <header className="site-header dna-header">
        <button className="back-button" type="button" onClick={onBack}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m12.5 4-6 6 6 6M7 10h9" /></svg>
          <span>NETWORK OBSERVATION</span>
        </button>
        <div className="capture-name">
          <span className="status-dot" aria-hidden="true" />
          DNA GENERATED / {capture.connections.length} RELATIONSHIPS
        </div>
      </header>

      <section className="dna-stage" aria-labelledby="dna-title">
        <div className="dna-copy">
          <span className="section-index">02 / NETWORK DNA</span>
          <h1 id="dna-title">NETWORK<br />FINGERPRINT</h1>
          <p>Each rung represents one communication relationship.</p>
        </div>

        <div className="dna-viewport">
          <DnaScene
            connections={capture.connections}
            isHandoff={isHandoff}
            hoveredId={hoveredId}
            selectedId={selectedId}
            onHover={setHoveredId}
            onSelect={(connectionId) => setSelectedId(connectionId)}
            onClearSelection={() => setSelectedId(null)}
          />
          <div className="dna-reticle" aria-hidden="true"><span /><span /><span /><span /></div>
        </div>

        <div className="dna-controls-hint" aria-hidden="true">
          <span>DRAG TO ROTATE</span>
          <i />
          <span>SCROLL TO ZOOM</span>
          <i />
          <span>SELECT A RUNG</span>
        </div>

        <ConnectionDecodePanel
          key={selected?.id ?? 'no-selection'}
          connection={selected}
          endpoints={capture.endpoints}
          onClose={() => setSelectedId(null)}
        />
      </section>
    </main>
  )
}
