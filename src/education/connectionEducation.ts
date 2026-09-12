import type { NetworkConnection, NetworkEndpoint } from '../types/network'

export interface ConnectionExplanation {
  title: string
  summary: string
  context?: string
}

export interface WiresharkFilter {
  id: 'endpoint' | 'protocol' | 'destination'
  expression: string
  explanation: string
}

export function findEndpoint(ip: string, endpoints: NetworkEndpoint[]) {
  return endpoints.find((endpoint) => endpoint.ip === ip)
}

export function getKnownEndpointName(endpoint?: NetworkEndpoint) {
  if (!endpoint || endpoint.name === 'UNKNOWN ENDPOINT') return undefined
  return endpoint.name
}

function readableName(name: string) {
  return name.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function endpointPhrase(endpoint: NetworkEndpoint | undefined, fallback: string) {
  const knownName = getKnownEndpointName(endpoint)
  if (knownName) return readableName(knownName)
  if (endpoint?.role === 'external') return 'an unidentified external endpoint'
  return fallback
}

export function explainConnection(
  connection: NetworkConnection,
  endpoints: NetworkEndpoint[],
): ConnectionExplanation {
  const source = findEndpoint(connection.source, endpoints)
  const destination = findEndpoint(connection.destination, endpoints)
  const actor = source?.role === 'local'
    ? 'Your device'
    : endpointPhrase(source, 'The source endpoint')
  const target = endpointPhrase(destination, 'the destination endpoint')
  const hasUnknownEndpoint = !getKnownEndpointName(source) || !getKnownEndpointName(destination)
  const context = hasUnknownEndpoint
    ? 'An unidentified endpoint is simply unattributed in this capture; that does not make it malicious.'
    : undefined

  switch (connection.protocol) {
    case 'DNS':
      return {
        title: 'DNS LOOKUP',
        summary: `${actor} exchanged DNS traffic with ${target}. DNS translates domain names into IP addresses so devices know where to connect.`,
        context,
      }
    case 'HTTPS':
      return {
        title: 'ENCRYPTED WEB CONNECTION',
        summary: `${actor} exchanged encrypted web traffic with ${target}. HTTPS protects data while it travels across the network, but encryption alone does not establish whether the activity is trustworthy.`,
        context,
      }
    case 'TLS':
      return {
        title: 'ENCRYPTED TLS SESSION',
        summary: `${actor} established an encrypted TLS session with ${target}. TLS protects data in transit while leaving basic connection metadata visible to network analysis.`,
        context,
      }
    case 'TCP':
      return {
        title: 'TCP CONNECTION',
        summary: `${actor} used TCP to communicate with ${target}. TCP provides reliable, ordered delivery; using TCP is normal and does not indicate risk by itself.`,
        context,
      }
    case 'UDP':
      return {
        title: 'UDP EXCHANGE',
        summary: `${actor} used UDP to communicate with ${target}. UDP sends data without establishing a persistent session and is common for timing, discovery, and other low-latency traffic.`,
        context,
      }
  }
}

function protocolDetails(protocol: NetworkConnection['protocol']) {
  switch (protocol) {
    case 'DNS': return { qualifier: 'dns' }
    case 'HTTPS':
    case 'TLS': return { qualifier: 'tls', transport: 'tcp' as const }
    case 'TCP': return { qualifier: 'tcp', transport: 'tcp' as const }
    case 'UDP': return { qualifier: 'udp', transport: 'udp' as const }
  }
}

export function generateWiresharkFilters(connection: NetworkConnection): WiresharkFilter[] {
  const destination = connection.destination
  const details = protocolDetails(connection.protocol)
  const filters: WiresharkFilter[] = [
    {
      id: 'endpoint',
      expression: `ip.addr == ${destination}`,
      explanation: `Shows packets where ${destination} appears as either the source or destination.`,
    },
    {
      id: 'protocol',
      expression: `ip.addr == ${destination} && ${details.qualifier}`,
      explanation: `Narrows those packets to traffic Wireshark identifies as ${details.qualifier.toUpperCase()}.`,
    },
  ]

  if (details.transport && connection.destinationPort !== undefined) {
    filters.push({
      id: 'destination',
      expression: `ip.dst == ${destination} && ${details.transport}.dstport == ${connection.destinationPort}`,
      explanation: `Shows ${details.transport.toUpperCase()} packets sent to ${destination} on destination port ${connection.destinationPort}.`,
    })
  }

  return filters
}
