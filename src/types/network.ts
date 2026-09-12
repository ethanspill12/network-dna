export type EndpointRole = 'local' | 'infrastructure' | 'service' | 'external'

export interface NetworkEndpoint {
  id: string
  name: string
  ip: string
  role: EndpointRole
  x: number
  y: number
}

export interface NetworkConnection {
  id: string
  source: string
  destination: string
  protocol: 'DNS' | 'HTTPS' | 'TLS' | 'TCP' | 'UDP'
  sourcePort?: number
  destinationPort?: number
  packets: number
  bytes: number
  firstSeen: number
  lastSeen: number
  status: 'normal' | 'investigate'
}

export interface NetworkCapture {
  id: string
  name: string
  duration: number
  endpoints: NetworkEndpoint[]
  connections: NetworkConnection[]
}
