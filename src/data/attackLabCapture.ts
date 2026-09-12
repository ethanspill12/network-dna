import { detectEducationalBeaconing } from '../analysis/beaconDetection'
import { adaptCapture } from './captureAdapter'
import type { CaptureContract, NetworkCapture } from '../types/network'

export const C2_CONNECTION_ID = 'lab-c2-beacon'

const beaconTimes = [0, 5.04, 9.98, 15.03, 20.01, 25.06, 30.02, 34.99, 40.05, 45.01]
const finding = detectEducationalBeaconing({
  eventTimes: beaconTimes,
  outboundEvents: beaconTimes.length,
  endpointIsUnknownExternal: true,
  servicePort: 4443,
})

const simulatedContract: CaptureContract = {
  filename: 'SIMULATED-C2-BEACONING.lab',
  duration: 52,
  connections: [
    {
      id: 'lab-dns', roleModel: 'client-server', clientIp: '192.168.50.24', clientPort: 53120,
      serverIp: '8.8.8.8', serverPort: 53, transportProtocol: 'UDP', applicationProtocol: 'DNS',
      displayProtocol: 'DNS', packetsTotal: 36, packetsClientToServer: 18, packetsServerToClient: 18,
      bytesTotal: 5184, bytesClientToServer: 2304, bytesServerToClient: 2880,
      firstSeen: 0.2, lastSeen: 49.4, riskScore: 0, status: 'normal',
    },
    {
      id: 'lab-web', roleModel: 'client-server', clientIp: '192.168.50.24', clientPort: 52741,
      serverIp: '93.184.216.34', serverPort: 443, transportProtocol: 'TCP', applicationProtocol: 'TLS',
      displayProtocol: 'TLS', packetsTotal: 124, packetsClientToServer: 52, packetsServerToClient: 72,
      bytesTotal: 188420, bytesClientToServer: 28410, bytesServerToClient: 160010,
      firstSeen: 1.1, lastSeen: 41.8, riskScore: 0, status: 'normal',
    },
    {
      id: 'lab-development', roleModel: 'client-server', clientIp: '192.168.50.24', clientPort: 52908,
      serverIp: '140.82.112.4', serverPort: 443, transportProtocol: 'TCP', applicationProtocol: 'TLS',
      displayProtocol: 'TLS', packetsTotal: 89, packetsClientToServer: 39, packetsServerToClient: 50,
      bytesTotal: 106730, bytesClientToServer: 23410, bytesServerToClient: 83320,
      firstSeen: 4.3, lastSeen: 47.5, riskScore: 0, status: 'normal',
    },
    {
      id: 'lab-ntp', roleModel: 'client-server', clientIp: '192.168.50.24', clientPort: 54901,
      serverIp: '203.0.113.12', serverPort: 123, transportProtocol: 'UDP', applicationProtocol: null,
      displayProtocol: 'UDP', packetsTotal: 8, packetsClientToServer: 4, packetsServerToClient: 4,
      bytesTotal: 720, bytesClientToServer: 360, bytesServerToClient: 360,
      firstSeen: 2.2, lastSeen: 44.2, riskScore: 0, status: 'normal',
    },
    {
      id: 'lab-local-discovery', roleModel: 'neutral', endpointAIp: '192.168.50.1', endpointAPort: 5353,
      endpointBIp: '192.168.50.24', endpointBPort: 5353, transportProtocol: 'UDP', applicationProtocol: null,
      displayProtocol: 'UDP', packetsTotal: 42, packetsAToB: 19, packetsBToA: 23,
      bytesTotal: 6632, bytesAToB: 2964, bytesBToA: 3668,
      firstSeen: 0.6, lastSeen: 50.1, riskScore: 0, status: 'normal',
    },
    {
      id: 'lab-cloud', roleModel: 'client-server', clientIp: '192.168.50.18', clientPort: 51844,
      serverIp: '198.51.100.25', serverPort: 443, transportProtocol: 'TCP', applicationProtocol: 'TLS',
      displayProtocol: 'TLS', packetsTotal: 76, packetsClientToServer: 31, packetsServerToClient: 45,
      bytesTotal: 89410, bytesClientToServer: 19380, bytesServerToClient: 70030,
      firstSeen: 5.9, lastSeen: 48.6, riskScore: 0, status: 'normal',
    },
    {
      id: C2_CONNECTION_ID, roleModel: 'client-server', clientIp: '192.168.50.24', clientPort: 52318,
      serverIp: '198.51.100.77', serverPort: 4443, transportProtocol: 'TCP', applicationProtocol: null,
      displayProtocol: 'TCP', packetsTotal: 20, packetsClientToServer: 10, packetsServerToClient: 10,
      bytesTotal: 3280, bytesClientToServer: 1480, bytesServerToClient: 1800,
      firstSeen: beaconTimes[0], lastSeen: beaconTimes.at(-1) ?? 0,
      riskScore: finding.score, status: finding.status,
    },
  ],
}

const adapted = adaptCapture(simulatedContract)

export const c2AttackLabCapture: NetworkCapture = {
  ...adapted,
  id: 'attack-lab-c2-beaconing',
  connections: adapted.connections.map((connection) => connection.id === C2_CONNECTION_ID
    ? { ...connection, simulation: finding }
    : connection),
}
