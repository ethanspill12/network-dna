export type EndpointRole = 'local' | 'infrastructure' | 'service' | 'external'
export type TransportProtocol = 'TCP' | 'UDP'
export type ConnectionStatus = 'normal' | 'low-concern' | 'suspicious' | 'high-risk'

interface ContractConnectionBase {
  id: string
  transportProtocol: TransportProtocol
  applicationProtocol: string | null
  displayProtocol: string
  packetsTotal: number
  bytesTotal: number
  firstSeen: number
  lastSeen: number
  riskScore: number
  status: ConnectionStatus
}

export interface ClientServerContractConnection extends ContractConnectionBase {
  roleModel: 'client-server'
  clientIp: string
  clientPort: number | null
  serverIp: string
  serverPort: number | null
  packetsClientToServer: number
  packetsServerToClient: number
  bytesClientToServer: number
  bytesServerToClient: number
}

export interface NeutralContractConnection extends ContractConnectionBase {
  roleModel: 'neutral'
  endpointAIp: string
  endpointAPort: number | null
  endpointBIp: string
  endpointBPort: number | null
  packetsAToB: number
  packetsBToA: number
  bytesAToB: number
  bytesBToA: number
}

export type ContractConnection = ClientServerContractConnection | NeutralContractConnection

export interface CaptureContract {
  filename: string
  duration: number
  connections: ContractConnection[]
}

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
  roleModel: 'client-server' | 'neutral'
  source: string
  destination: string
  sourcePort: number | null
  destinationPort: number | null
  transportProtocol: TransportProtocol
  applicationProtocol: string | null
  displayProtocol: string
  packets: number
  bytes: number
  firstSeen: number
  lastSeen: number
  riskScore: number
  status: ConnectionStatus
  contract: ContractConnection
}

export interface NetworkCapture {
  id: string
  name: string
  duration: number
  endpoints: NetworkEndpoint[]
  connections: NetworkConnection[]
  totalPackets: number
  totalConnections: number
  totalEndpoints: number
  totalAnomalies: number
  omittedConnections: number
}
