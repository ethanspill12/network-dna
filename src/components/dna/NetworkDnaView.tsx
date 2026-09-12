import { useEffect, useState } from 'react'
import { mockCapture } from '../../data/mockCapture'
import { DnaScene } from './DnaScene'

interface NetworkDnaViewProps {
  isHandoff?: boolean
  seamlessEntry?: boolean
  onBack: () => void
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export function NetworkDnaView({ isHandoff = false, seamlessEntry = false, onBack }: NetworkDnaViewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = mockCapture.connections.find((connection) => connection.id === selectedId)

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
          DNA GENERATED / {mockCapture.connections.length} RELATIONSHIPS
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

        <aside className={`connection-hud ${selected ? 'is-visible' : ''}`} aria-live="polite">
          {selected ? (
            <>
              <div className="hud-heading">
                <span>RELATIONSHIP / {selected.id.toUpperCase()}</span>
                <button type="button" onClick={() => setSelectedId(null)} aria-label="Close connection details">×</button>
              </div>
              <dl>
                <div><dt>SOURCE IP</dt><dd>{selected.source}</dd></div>
                <div><dt>DESTINATION IP</dt><dd>{selected.destination}</dd></div>
                <div><dt>PROTOCOL</dt><dd>{selected.protocol}</dd></div>
                <div><dt>PACKETS</dt><dd>{selected.packets.toLocaleString()}</dd></div>
                <div><dt>DATA</dt><dd>{formatBytes(selected.bytes)}</dd></div>
                <div><dt>STATUS</dt><dd className="normal-status"><span />{selected.status.toUpperCase()}</dd></div>
              </dl>
            </>
          ) : (
            <div className="connection-placeholder">
              <span>CONNECTION DATA</span>
              <p>Hover to identify a relationship.<br />Select a rung to inspect it.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}
