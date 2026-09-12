import type { BeaconSignal, ConnectionStatus, SimulationFinding } from '../types/network'

interface BeaconEvidence {
  eventTimes: number[]
  outboundEvents: number
  endpointIsUnknownExternal: boolean
  servicePort: number | null
}

const COMMON_SERVICE_PORTS = new Set([53, 80, 123, 443])

function intervalCoefficientOfVariation(eventTimes: number[]) {
  const intervals = eventTimes.slice(1).map((time, index) => time - eventTimes[index])
  if (intervals.length < 2) return Number.POSITIVE_INFINITY
  const mean = intervals.reduce((total, interval) => total + interval, 0) / intervals.length
  const variance = intervals.reduce((total, interval) => total + (interval - mean) ** 2, 0) / intervals.length
  return mean > 0 ? Math.sqrt(variance) / mean : Number.POSITIVE_INFINITY
}

export function detectEducationalBeaconing(evidence: BeaconEvidence): SimulationFinding {
  const regularity = intervalCoefficientOfVariation(evidence.eventTimes)
  const isHighlyRegular = evidence.eventTimes.length >= 6 && regularity <= 0.08
  const isRepeated = evidence.outboundEvents >= 8
  const unusualService = evidence.servicePort !== null && !COMMON_SERVICE_PORTS.has(evidence.servicePort)

  const signals: BeaconSignal[] = [
    {
      id: 'interval-regularity',
      label: 'INTERVAL REGULARITY',
      value: isHighlyRegular ? 'HIGH' : 'LOW',
      points: isHighlyRegular ? 35 : 0,
    },
    {
      id: 'repeated-outbound',
      label: 'REPEATED OUTBOUND TRAFFIC',
      value: isRepeated ? 'YES' : 'NO',
      points: isRepeated ? 25 : 0,
    },
    {
      id: 'unknown-external',
      label: 'UNKNOWN EXTERNAL ENDPOINT',
      value: evidence.endpointIsUnknownExternal ? 'YES' : 'NO',
      points: evidence.endpointIsUnknownExternal ? 20 : 0,
    },
    {
      id: 'unusual-service',
      label: 'UNUSUAL SERVICE / PORT',
      value: unusualService ? 'YES' : 'NO',
      points: unusualService ? 15 : 0,
    },
  ]
  const score = signals.reduce((total, signal) => total + signal.points, 0)
  const status: ConnectionStatus = score >= 80
    ? 'high-risk'
    : score >= 55
      ? 'suspicious'
      : score >= 25
        ? 'low-concern'
        : 'normal'

  return {
    scenario: 'c2-beaconing',
    eventTimes: [...evidence.eventTimes],
    score,
    status,
    signals,
  }
}
