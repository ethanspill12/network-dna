import type {
  CaptureContract,
  ConnectionStatus,
  ContractConnection,
  EndpointRole,
  NetworkCapture,
  NetworkConnection,
  NetworkEndpoint,
  TransportProtocol,
} from '../types/network'

export const MAX_VISUALIZED_CONNECTIONS = 48

const statuses = new Set<ConnectionStatus>(['normal', 'low-concern', 'suspicious', 'high-risk'])

function isPrivateIpv4(ip: string) {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false
  return parts[0] === 10
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168)
}

function endpointRole(ip: string, isServer: boolean): EndpointRole {
  if (isPrivateIpv4(ip)) return 'local'
  return isServer ? 'service' : 'external'
}

function endpointName(ip: string, isServer: boolean) {
  if (isPrivateIpv4(ip)) return 'PRIVATE ENDPOINT'
  return isServer ? 'SERVICE ENDPOINT' : 'EXTERNAL ENDPOINT'
}

function contractEndpoints(connection: ContractConnection) {
  if (connection.roleModel === 'client-server') {
    return {
      source: connection.clientIp,
      sourcePort: connection.clientPort,
      destination: connection.serverIp,
      destinationPort: connection.serverPort,
    }
  }
  return {
    source: connection.endpointAIp,
    sourcePort: connection.endpointAPort,
    destination: connection.endpointBIp,
    destinationPort: connection.endpointBPort,
  }
}

function adaptConnection(connection: ContractConnection): NetworkConnection {
  const endpoints = contractEndpoints(connection)
  return {
    id: connection.id,
    roleModel: connection.roleModel,
    ...endpoints,
    transportProtocol: connection.transportProtocol,
    applicationProtocol: connection.applicationProtocol,
    displayProtocol: connection.displayProtocol,
    packets: connection.packetsTotal,
    bytes: connection.bytesTotal,
    firstSeen: connection.firstSeen,
    lastSeen: connection.lastSeen,
    riskScore: connection.riskScore,
    status: statuses.has(connection.status) ? connection.status : 'normal',
    contract: connection,
  }
}

function validateContract(capture: CaptureContract) {
  if (!capture || typeof capture.filename !== 'string' || !Array.isArray(capture.connections)) {
    throw new Error('The analysis service returned an invalid capture response.')
  }
  if (!Number.isFinite(capture.duration) || capture.duration < 0) {
    throw new Error('The analysis service returned an invalid capture duration.')
  }
  for (const connection of capture.connections) {
    if (!connection.id || !['client-server', 'neutral'].includes(connection.roleModel)) {
      throw new Error('The analysis service returned an unsupported connection record.')
    }
    if (!['TCP', 'UDP'].includes(connection.transportProtocol as TransportProtocol)) {
      throw new Error(`Connection ${connection.id} has an unsupported transport protocol.`)
    }
  }
}

export function adaptCapture(capture: CaptureContract): NetworkCapture {
  validateContract(capture)
  const ranked = [...capture.connections].sort(
    (a, b) => b.packetsTotal - a.packetsTotal || b.bytesTotal - a.bytesTotal || a.id.localeCompare(b.id),
  )
  const visibleContracts = ranked.slice(0, MAX_VISUALIZED_CONNECTIONS)
  const connections = visibleContracts.map(adaptConnection)
  const allIps = new Set<string>()
  const visibleIps = new Set<string>()
  const serverIps = new Set<string>()

  for (const connection of capture.connections) {
    const endpoints = contractEndpoints(connection)
    allIps.add(endpoints.source)
    allIps.add(endpoints.destination)
    if (connection.roleModel === 'client-server') serverIps.add(connection.serverIp)
  }
  for (const connection of connections) {
    visibleIps.add(connection.source)
    visibleIps.add(connection.destination)
  }

  const orderedIps = [...visibleIps].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  const endpoints: NetworkEndpoint[] = orderedIps.map((ip, index) => {
    const angle = -Math.PI / 2 + (index / Math.max(orderedIps.length, 1)) * Math.PI * 2
    const isServer = serverIps.has(ip)
    return {
      id: `endpoint-${index + 1}`,
      name: endpointName(ip, isServer),
      ip,
      role: endpointRole(ip, isServer),
      x: 50 + Math.cos(angle) * 37,
      y: 51 + Math.sin(angle) * 36,
    }
  })

  return {
    id: `capture-${capture.filename}`,
    name: capture.filename,
    duration: capture.duration,
    endpoints,
    connections,
    totalPackets: capture.connections.reduce((total, connection) => total + connection.packetsTotal, 0),
    totalConnections: capture.connections.length,
    totalEndpoints: allIps.size,
    totalAnomalies: capture.connections.filter((connection) => connection.status !== 'normal').length,
    omittedConnections: Math.max(0, capture.connections.length - connections.length),
  }
}
