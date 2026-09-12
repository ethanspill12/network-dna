import { useEffect, useState } from 'react'
import {
  explainConnection,
  findEndpoint,
  generateWiresharkFilters,
  getKnownEndpointName,
} from '../../education/connectionEducation'
import type { NetworkConnection, NetworkEndpoint } from '../../types/network'

interface ConnectionDecodePanelProps {
  connection?: NetworkConnection
  endpoints: NetworkEndpoint[]
  onClose: () => void
}

type CopyState = { expression: string; status: 'copied' | 'failed' } | null

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

function formatCaptureTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainder = (seconds % 60).toFixed(2).padStart(5, '0')
  return `${minutes}:${remainder}`
}

async function copyWithFallback(value: string) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    const field = document.createElement('textarea')
    try {
      field.value = value
      field.setAttribute('readonly', '')
      field.style.position = 'fixed'
      field.style.opacity = '0'
      document.body.appendChild(field)
      field.select()
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      field.remove()
    }
  }
}

export function ConnectionDecodePanel({ connection, endpoints, onClose }: ConnectionDecodePanelProps) {
  const [decoded, setDecoded] = useState(false)
  const [copyState, setCopyState] = useState<CopyState>(null)

  useEffect(() => {
    setDecoded(false)
    setCopyState(null)
  }, [connection?.id])

  if (!connection) {
    return (
      <aside className="connection-hud" aria-live="polite">
        <div className="connection-placeholder">
          <span>CONNECTION DATA</span>
          <p>Hover to identify a relationship.<br />Select a rung to understand it.</p>
        </div>
      </aside>
    )
  }

  const sourceEndpoint = findEndpoint(connection.source, endpoints)
  const destinationEndpoint = findEndpoint(connection.destination, endpoints)
  const sourceName = getKnownEndpointName(sourceEndpoint)
  const destinationName = getKnownEndpointName(destinationEndpoint)
  const explanation = explainConnection(connection, endpoints)
  const filters = generateWiresharkFilters(connection)

  const copyFilter = async (expression: string) => {
    const copied = await copyWithFallback(expression)
    setCopyState({ expression, status: copied ? 'copied' : 'failed' })
  }

  return (
    <aside className={`connection-hud is-visible ${decoded ? 'connection-hud--decoded' : ''}`} aria-live="polite">
      <div className="hud-heading">
        <span>RELATIONSHIP / {connection.id.toUpperCase()}</span>
        <button type="button" onClick={onClose} aria-label="Close connection details">×</button>
      </div>

      <div className="connection-overview">
        <span className="decode-kicker">WHAT IS THIS?</span>
        <h2>{explanation.title}</h2>
        <p>{explanation.summary}</p>
        {explanation.context && <p className="connection-context">{explanation.context}</p>}
        <div className="overview-status">
          <span>STATUS</span>
          <strong className="normal-status"><i />{connection.status.toUpperCase()}</strong>
        </div>
      </div>

      {!decoded ? (
        <button className="decode-button" type="button" onClick={() => setDecoded(true)}>
          <span>DECODE CONNECTION</span><b aria-hidden="true">→</b>
        </button>
      ) : (
        <div className="decode-details">
          <div className="decode-section-heading">
            <span>TECHNICAL DETAILS</span>
            <button type="button" onClick={() => setDecoded(false)}>OVERVIEW</button>
          </div>
          <dl>
            {sourceName && <div><dt>SOURCE ENDPOINT</dt><dd>{sourceName}</dd></div>}
            <div><dt>SOURCE IP</dt><dd>{connection.source}</dd></div>
            {destinationName && <div><dt>DESTINATION ENDPOINT</dt><dd>{destinationName}</dd></div>}
            <div><dt>DESTINATION IP</dt><dd>{connection.destination}</dd></div>
            <div><dt>PROTOCOL</dt><dd>{connection.protocol}</dd></div>
            {connection.sourcePort !== undefined && <div><dt>SOURCE PORT</dt><dd>{connection.sourcePort}</dd></div>}
            {connection.destinationPort !== undefined && <div><dt>DESTINATION PORT</dt><dd>{connection.destinationPort}</dd></div>}
            <div><dt>PACKETS</dt><dd>{connection.packets.toLocaleString()}</dd></div>
            <div><dt>DATA</dt><dd>{formatBytes(connection.bytes)}</dd></div>
            <div><dt>FIRST SEEN</dt><dd>{formatCaptureTime(connection.firstSeen)}</dd></div>
            <div><dt>LAST SEEN</dt><dd>{formatCaptureTime(connection.lastSeen)}</dd></div>
            <div><dt>STATUS</dt><dd>{connection.status.toUpperCase()}</dd></div>
          </dl>

          <section className="wireshark-section" aria-labelledby="wireshark-heading">
            <div className="decode-section-heading">
              <span id="wireshark-heading">FIND THIS IN WIRESHARK</span>
            </div>
            <p className="wireshark-intro">Start broad, then narrow the display filter when you need more precision.</p>
            <ol className="filter-list">
              {filters.map((filter, index) => {
                const state = copyState?.expression === filter.expression ? copyState.status : null
                return (
                  <li key={filter.id}>
                    <span className="filter-index">0{index + 1}</span>
                    <code>{filter.expression}</code>
                    <p>{filter.explanation}</p>
                    <button type="button" onClick={() => void copyFilter(filter.expression)}>
                      {state === 'copied' ? 'COPIED' : state === 'failed' ? 'COPY FAILED' : 'COPY FILTER'}
                    </button>
                    {state === 'failed' && <small>Select the filter text and copy it manually.</small>}
                  </li>
                )
              })}
            </ol>
          </section>
        </div>
      )}
    </aside>
  )
}
