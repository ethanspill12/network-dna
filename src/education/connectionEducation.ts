import type { NetworkConnection, NetworkEndpoint } from '../types/network'

export interface ConnectionExplanation {
  title: string
  summary: string
  context?: string
}

export interface WiresharkFilter {
  id: string
  expression: string
  explanation: string
}

export function findEndpoint(ip: string, endpoints: NetworkEndpoint[]) {
  return endpoints.find((endpoint) => endpoint.ip === ip)
}

export function getKnownEndpointName(endpoint?: NetworkEndpoint) {
  if (!endpoint || ['UNKNOWN ENDPOINT', 'EXTERNAL ENDPOINT', 'SERVICE ENDPOINT'].includes(endpoint.name)) return undefined
  return endpoint.name
}

function endpointPhrase(endpoint: NetworkEndpoint | undefined, fallback: string) {
  const knownName = getKnownEndpointName(endpoint)
  if (knownName) return knownName.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
  return fallback
}

export function explainConnection(
  connection: NetworkConnection,
  endpoints: NetworkEndpoint[],
): ConnectionExplanation {
  if (connection.simulation?.scenario === 'c2-beaconing') {
    return {
      title: 'POTENTIAL C2 BEACONING',
      summary: 'This device repeatedly contacted the same external endpoint at unusually regular intervals. Automated software can create patterns like this, including malware communicating with command-and-control infrastructure.',
      context: 'This does not prove the device is infected, but the relationship deserves investigation.',
    }
  }
  const source = findEndpoint(connection.source, endpoints)
  const destination = findEndpoint(connection.destination, endpoints)
  const actor = connection.roleModel === 'client-server'
    ? endpointPhrase(source, 'A client endpoint')
    : endpointPhrase(source, 'Endpoint A')
  const target = connection.roleModel === 'client-server'
    ? endpointPhrase(destination, 'a service endpoint')
    : endpointPhrase(destination, 'Endpoint B')
  const context = 'An unattributed endpoint is not inherently suspicious; this capture simply does not provide a verified identity.'

  switch (connection.applicationProtocol) {
    case 'DNS':
      return {
        title: 'DNS LOOKUP',
        summary: `${actor} exchanged DNS traffic with ${target}. DNS translates domain names into IP addresses so devices know where to connect.`,
      }
    case 'HTTP':
      return {
        title: 'WEB CONNECTION',
        summary: `${actor} exchanged web traffic with ${target}. HTTP carries requests and responses between network endpoints.`,
        context,
      }
    case 'TLS':
      return {
        title: 'ENCRYPTED TLS SESSION',
        summary: `${actor} exchanged encrypted TLS traffic with ${target}. TLS protects data in transit, but encryption alone does not establish whether activity is trustworthy.`,
        context,
      }
  }

  if (connection.transportProtocol === 'TCP') {
    return {
      title: 'TCP CONNECTION',
      summary: `${actor} used TCP to communicate with ${target}. TCP provides reliable, ordered delivery and does not indicate risk by itself.`,
      context,
    }
  }
  return {
    title: 'UDP EXCHANGE',
    summary: `${actor} used UDP to communicate with ${target}. UDP is commonly used for discovery, timing, and other low-latency traffic.`,
    context,
  }
}

export function generateWiresharkFilters(connection: NetworkConnection): WiresharkFilter[] {
  const transport = connection.transportProtocol.toLowerCase()
  const filters: WiresharkFilter[] = []
  const contract = connection.contract

  if (contract.roleModel === 'client-server') {
    const server = contract.serverIp
    const port = contract.serverPort
    filters.push({
      id: 'server',
      expression: `ip.addr == ${server}`,
      explanation: `Shows packets where the service endpoint ${server} is either the source or destination.`,
    })
    filters.push({
      id: 'transport',
      expression: `ip.addr == ${server} && ${transport}`,
      explanation: `Narrows that relationship to ${connection.transportProtocol} traffic.`,
    })
    if (port !== null) {
      filters.push({
        id: 'service',
        expression: `ip.addr == ${server} && ${transport}.port == ${port}`,
        explanation: `Shows ${connection.transportProtocol} traffic involving the stable service port ${port}, in either packet direction.`,
      })
    }
    return filters
  }

  const endpointA = contract.endpointAIp
  const endpointB = contract.endpointBIp
  filters.push({
    id: 'endpoint-b',
    expression: `ip.addr == ${endpointB}`,
    explanation: `Shows packets where Endpoint B (${endpointB}) is either the source or destination.`,
  })
  filters.push({
    id: 'pair',
    expression: `ip.addr == ${endpointA} && ip.addr == ${endpointB} && ${transport}`,
    explanation: `Shows ${connection.transportProtocol} traffic exchanged between Endpoint A and Endpoint B without assigning client/server roles.`,
  })
  const portA = contract.endpointAPort
  const portB = contract.endpointBPort
  if (portA !== null && portB !== null) {
    filters.push({
      id: 'ports',
      expression: `ip.addr == ${endpointA} && ip.addr == ${endpointB} && ${transport}.port == ${portA} && ${transport}.port == ${portB}`,
      explanation: `Narrows the endpoint pair to the two observed ${connection.transportProtocol} ports, regardless of direction.`,
    })
  }
  return filters
}
