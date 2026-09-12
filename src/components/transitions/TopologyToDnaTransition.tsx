import type { NetworkCapture } from '../../types/network'
import { getDnaRungLayout, getHelixCoordinate } from '../../visualization/dnaGeometry'

const WIDTH = 1000
const HEIGHT = 600
const DNA_SCALE_X = 88
const DNA_SCALE_Y = 88

function projectDna(point: { x: number; y: number }) {
  return {
    x: WIDTH / 2 + point.x * DNA_SCALE_X,
    y: HEIGHT / 2 - point.y * DNA_SCALE_Y,
  }
}

function railPath(side: 0 | 1) {
  return Array.from({ length: 70 }, (_, index) => {
    const point = projectDna(getHelixCoordinate(index / 69, side))
    return `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
  }).join(' ')
}

export function TopologyToDnaTransition({ capture }: { capture: NetworkCapture }) {
  const endpointsByIp = new Map(capture.endpoints.map((endpoint) => [endpoint.ip, endpoint]))

  return (
    <div className="dna-transform" aria-label="Reorganizing network relationships into Network DNA">
      <svg className="dna-transform-geometry" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
        <defs>
          <filter id="transform-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g className="transform-rails">
          <path d={railPath(0)} />
          <path d={railPath(1)} />
        </g>

        <g className="transform-relationships">
          {capture.connections.map((connection, index) => {
            const source = endpointsByIp.get(connection.source)!
            const destination = endpointsByIp.get(connection.destination)!
            const layout = getDnaRungLayout(index, capture.connections.length)
            const dnaStart = projectDna(layout.start)
            const dnaEnd = projectDna(layout.end)
            const delay = 0.24 + index * 0.026

            return (
              <g key={connection.id} data-connection-id={connection.id}>
                <line
                  x1={source.x * 10}
                  y1={source.y * 6}
                  x2={destination.x * 10}
                  y2={destination.y * 6}
                >
                  <animate attributeName="x1" to={dnaStart.x} begin={`${delay}s`} dur="1.18s" fill="freeze" />
                  <animate attributeName="y1" to={dnaStart.y} begin={`${delay}s`} dur="1.18s" fill="freeze" />
                  <animate attributeName="x2" to={dnaEnd.x} begin={`${delay}s`} dur="1.18s" fill="freeze" />
                  <animate attributeName="y2" to={dnaEnd.y} begin={`${delay}s`} dur="1.18s" fill="freeze" />
                </line>
                <circle cx={source.x * 10} cy={source.y * 6} r="3">
                  <animate attributeName="cx" to={dnaStart.x} begin={`${delay}s`} dur="1.18s" fill="freeze" />
                  <animate attributeName="cy" to={dnaStart.y} begin={`${delay}s`} dur="1.18s" fill="freeze" />
                </circle>
                <circle cx={destination.x * 10} cy={destination.y * 6} r="3">
                  <animate attributeName="cx" to={dnaEnd.x} begin={`${delay}s`} dur="1.18s" fill="freeze" />
                  <animate attributeName="cy" to={dnaEnd.y} begin={`${delay}s`} dur="1.18s" fill="freeze" />
                </circle>
              </g>
            )
          })}
        </g>
      </svg>

      <div className="dna-transform-status">
        <span>REORGANIZING RELATIONSHIPS</span>
        <strong>{capture.connections.length} / {capture.connections.length}</strong>
        <i><b /></i>
      </div>
    </div>
  )
}
