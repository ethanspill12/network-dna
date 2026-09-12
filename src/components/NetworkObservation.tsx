import { useEffect, useMemo, useRef, useState } from 'react'
import { mockCapture } from '../data/mockCapture'
import type { NetworkConnection, NetworkEndpoint } from '../types/network'
import { TopologyToDnaTransition } from './transitions/TopologyToDnaTransition'

const VIEW_WIDTH = 1000
const VIEW_HEIGHT = 600

function point(endpoint: NetworkEndpoint) {
  return { x: endpoint.x * 10, y: endpoint.y * 6 }
}

function connectionPath(
  connection: NetworkConnection,
  endpointsByIp: Map<string, NetworkEndpoint>,
  index: number,
) {
  const source = point(endpointsByIp.get(connection.source)!)
  const destination = point(endpointsByIp.get(connection.destination)!)
  const middleX = (source.x + destination.x) / 2
  const middleY = (source.y + destination.y) / 2
  const dx = destination.x - source.x
  const dy = destination.y - source.y
  const length = Math.hypot(dx, dy) || 1
  const curve = (index % 2 === 0 ? 1 : -1) * Math.min(34, length * 0.08)
  const controlX = middleX - (dy / length) * curve
  const controlY = middleY + (dx / length) * curve

  return `M ${source.x} ${source.y} Q ${controlX} ${controlY} ${destination.x} ${destination.y}`
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

interface NetworkObservationProps {
  isTransforming?: boolean
  onGenerate: () => void
}

export function NetworkObservation({ isTransforming = false, onGenerate }: NetworkObservationProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null)
  const topologyRef = useRef<SVGSVGElement>(null)
  const endpointsByIp = useMemo(
    () => new Map(mockCapture.endpoints.map((endpoint) => [endpoint.ip, endpoint])),
    [],
  )
  const packetTotal = mockCapture.connections.reduce((total, connection) => total + connection.packets, 0)
  const anomalyTotal = mockCapture.connections.filter((connection) => connection.status === 'investigate').length
  const selected = mockCapture.endpoints.find((endpoint) => endpoint.id === selectedEndpoint)

  const isRelated = (connection: NetworkConnection) =>
    !selected || connection.source === selected.ip || connection.destination === selected.ip

  useEffect(() => {
    if (isTransforming) topologyRef.current?.pauseAnimations()
  }, [isTransforming])

  return (
    <main className={`observation ${isTransforming ? 'observation--transforming' : ''}`}>
      <header className="site-header observation-header">
        <a className="brand" href="/" aria-label="Return to Network DNA home">
          <span className="brand-mark" aria-hidden="true" />
          <span>NETWORK DNA</span>
        </a>
        <div className="capture-name">
          <span className="status-dot" aria-hidden="true" />
          MOCK CAPTURE / {mockCapture.name.toUpperCase()}
        </div>
      </header>

      <section className="observation-stage" aria-labelledby="observation-title">
        <div className="observation-copy">
          <span className="section-index">01 / OBSERVE</span>
          <h1 id="observation-title">NETWORK<br />RECONSTRUCTION</h1>
          <p>These machines communicated during this capture.</p>
        </div>

        <aside className="capture-hud" aria-label="Capture statistics">
          <div className="hud-heading">
            <span>CAPTURE</span>
            <span className="hud-live">RECONSTRUCTED</span>
          </div>
          <dl>
            <div><dt>PACKETS</dt><dd>{packetTotal.toLocaleString()}</dd></div>
            <div><dt>ENDPOINTS</dt><dd>{mockCapture.endpoints.length}</dd></div>
            <div><dt>CONNECTIONS</dt><dd>{mockCapture.connections.length}</dd></div>
            <div><dt>ANOMALIES</dt><dd>{anomalyTotal}</dd></div>
            <div><dt>DURATION</dt><dd>{formatDuration(mockCapture.duration)}</dd></div>
          </dl>
        </aside>

        <div className="topology-shell">
          <div className="topology-grid" aria-hidden="true" />
          <svg
            ref={topologyRef}
            className="topology"
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            role="img"
            aria-label="Network topology with eight endpoints and animated communication paths"
          >
            <defs>
              <filter id="line-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              {mockCapture.connections.map((connection, index) => (
                <path
                  key={`motion-${connection.id}`}
                  id={`motion-${connection.id}`}
                  d={connectionPath(connection, endpointsByIp, index)}
                />
              ))}
            </defs>

            <g className="connection-layer">
              {mockCapture.connections.map((connection, index) => {
                const path = connectionPath(connection, endpointsByIp, index)
                const active = isRelated(connection)
                const duration = 2.7 + (index % 5) * 0.72 + (connection.packets % 4) * 0.16
                const delay = -((index * 0.83) % duration)

                return (
                  <g key={connection.id} className={active ? 'connection is-active' : 'connection is-muted'}>
                    <path className="connection-shadow" d={path} />
                    <path className="connection-line" d={path} />
                    <circle className="packet-pulse" r={index % 3 === 0 ? 3.4 : 2.5}>
                      <animateMotion
                        dur={`${duration}s`}
                        begin={`${delay}s`}
                        repeatCount="indefinite"
                        rotate="auto"
                      >
                        <mpath href={`#motion-${connection.id}`} />
                      </animateMotion>
                    </circle>
                  </g>
                )
              })}
            </g>

            <g className="node-layer">
              {mockCapture.endpoints.map((endpoint, index) => {
                const position = point(endpoint)
                const active = !selected || selected.id === endpoint.id
                const related = selected
                  ? mockCapture.connections.some(
                      (connection) =>
                        isRelated(connection) &&
                        (connection.source === endpoint.ip || connection.destination === endpoint.ip),
                    )
                  : false
                const anchor = endpoint.x > 73 ? 'end' : endpoint.x < 27 ? 'start' : 'middle'
                const labelX = anchor === 'end' ? position.x - 20 : anchor === 'start' ? position.x + 20 : position.x
                const labelY = position.y < 100 ? position.y + 48 : position.y - 31

                return (
                  <g
                    key={endpoint.id}
                    className={`network-node node--${endpoint.role} ${active || related ? '' : 'is-muted'}`}
                    onClick={() => setSelectedEndpoint(selected?.id === endpoint.id ? null : endpoint.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${endpoint.name}, ${endpoint.ip}`}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setSelectedEndpoint(selected?.id === endpoint.id ? null : endpoint.id)
                      }
                    }}
                  >
                    <circle className="node-orbit" cx={position.x} cy={position.y} r={endpoint.role === 'local' ? 27 : 19} />
                    <circle
                      className="node-ring"
                      cx={position.x}
                      cy={position.y}
                      r={endpoint.role === 'local' ? 14 : 10}
                      style={{ animationDelay: `${index * -0.37}s` }}
                    />
                    <circle className="node-core" cx={position.x} cy={position.y} r={endpoint.role === 'local' ? 4.5 : 3.5} />
                    <text className="node-name" x={labelX} y={labelY} textAnchor={anchor}>{endpoint.name}</text>
                    <text className="node-ip" x={labelX} y={labelY + 16} textAnchor={anchor}>{endpoint.ip}</text>
                  </g>
                )
              })}
            </g>
          </svg>

          <div className="topology-readout" aria-live="polite">
            <span>{selected ? 'ENDPOINT SELECTED' : 'LIVE RELATIONSHIP MAP'}</span>
            <strong>{selected ? `${selected.name} / ${selected.ip}` : 'SELECT A NODE TO ISOLATE TRAFFIC'}</strong>
          </div>
        </div>

        <button className="generate-button" type="button" onClick={onGenerate} disabled={isTransforming}>
          <span>GENERATE NETWORK DNA</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 4c8 0 6 16 14 16M19 4C11 4 13 20 5 20M8 8h8M8 16h8" />
          </svg>
        </button>
      </section>
      {isTransforming && <TopologyToDnaTransition />}
    </main>
  )
}
