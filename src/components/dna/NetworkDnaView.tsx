import { useEffect, useMemo, useState } from 'react'
import type { ConnectionStatus, MutationStage, NetworkCapture } from '../../types/network'
import { ConnectionDecodePanel } from './ConnectionDecodePanel'
import { DnaScene } from './DnaScene'

interface NetworkDnaViewProps {
  capture: NetworkCapture
  attackLab?: { targetConnectionId: string }
  isHandoff?: boolean
  seamlessEntry?: boolean
  onBack: () => void
}

export function NetworkDnaView({ capture, attackLab, isHandoff = false, seamlessEntry = false, onBack }: NetworkDnaViewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mutationStage, setMutationStage] = useState<MutationStage>('baseline')
  const visibleConnections = useMemo(() => capture.connections.map((connection) => {
    if (!attackLab || connection.id !== attackLab.targetConnectionId) return connection
    const stateByStage: Record<MutationStage, { status: ConnectionStatus; riskScore: number }> = {
      baseline: { status: 'normal', riskScore: 0 },
      deviation: { status: 'low-concern', riskScore: 35 },
      warning: { status: 'suspicious', riskScore: 70 },
      detected: { status: connection.simulation?.status ?? 'high-risk', riskScore: connection.simulation?.score ?? 95 },
    }
    return {
      ...connection,
      ...stateByStage[mutationStage],
      simulation: mutationStage === 'detected' ? connection.simulation : undefined,
    }
  }), [attackLab, capture.connections, mutationStage])
  const selected = visibleConnections.find((connection) => connection.id === selectedId)

  useEffect(() => {
    if (!attackLab) return
    setMutationStage('baseline')
    const timers = [
      window.setTimeout(() => setMutationStage('deviation'), 1500),
      window.setTimeout(() => setMutationStage('warning'), 2800),
      window.setTimeout(() => setMutationStage('detected'), 4300),
    ]
    return () => timers.forEach(window.clearTimeout)
  }, [attackLab])

  useEffect(() => {
    document.body.style.cursor = hoveredId ? 'pointer' : ''
    return () => { document.body.style.cursor = '' }
  }, [hoveredId])

  return (
    <main className={`dna-view ${seamlessEntry ? 'dna-view--seamless' : ''} ${isHandoff ? 'dna-view--handoff' : ''}`}>
      <header className="site-header dna-header">
        <button className="back-button" type="button" onClick={onBack}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m12.5 4-6 6 6 6M7 10h9" /></svg>
          <span>{attackLab ? 'ATTACK LAB' : 'NETWORK OBSERVATION'}</span>
        </button>
        <div className="capture-name">
          <span className="status-dot" aria-hidden="true" />
          {attackLab ? 'SIMULATED DATA / EDUCATIONAL MODE' : `DNA GENERATED / ${capture.connections.length} RELATIONSHIPS`}
        </div>
      </header>

      <section className="dna-stage" aria-labelledby="dna-title">
        <div className="dna-copy">
          <span className="section-index">{attackLab ? 'ATTACK LAB / C2 BEACONING' : '02 / NETWORK DNA'}</span>
          <h1 id="dna-title">NETWORK<br />FINGERPRINT</h1>
          <p>{attackLab ? 'Watch one repeated relationship deviate from the simulated baseline.' : 'Each rung represents one communication relationship.'}</p>
        </div>

        <div className="dna-viewport">
          <DnaScene
            connections={visibleConnections}
            mutation={attackLab ? { connectionId: attackLab.targetConnectionId, stage: mutationStage } : undefined}
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

        {attackLab && (
          <div className={`mutation-alert mutation-alert--${mutationStage}`} role="status" aria-live="polite">
            <span>{mutationStage === 'baseline' ? 'SIMULATED BASELINE' : mutationStage === 'deviation' ? 'DEVIATION OBSERVED' : mutationStage === 'warning' ? 'PATTERN STRENGTHENING' : 'DNA MUTATION DETECTED'}</span>
            <strong>{mutationStage === 'detected' ? 'HIGH INVESTIGATION PRIORITY' : mutationStage === 'baseline' ? 'MONITORING RELATIONSHIPS' : 'ANALYZING REPEATED ACTIVITY'}</strong>
            <i><b /></i>
          </div>
        )}

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
