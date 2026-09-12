// Retained as a development fixture; real capture upload is the primary application path.
export const mockCapture = {
  id: 'capture-001',
  name: 'development-session.pcapng',
  duration: 167,
  endpoints: [
    { id: 'local', name: 'LOCAL DEVICE', ip: '192.168.1.14', role: 'local', x: 50, y: 51 },
    { id: 'gateway', name: 'NETWORK GATEWAY', ip: '192.168.1.1', role: 'infrastructure', x: 21, y: 51 },
    { id: 'google-dns', name: 'GOOGLE DNS', ip: '8.8.8.8', role: 'service', x: 33, y: 19 },
    { id: 'cloudflare-dns', name: 'CLOUDFLARE DNS', ip: '1.1.1.1', role: 'service', x: 68, y: 18 },
    { id: 'github', name: 'GITHUB', ip: '140.82.112.4', role: 'service', x: 81, y: 43 },
    { id: 'cloud', name: 'CLOUD SERVICE', ip: '34.120.54.55', role: 'service', x: 69, y: 78 },
    { id: 'unknown-a', name: 'UNKNOWN ENDPOINT', ip: '203.0.113.18', role: 'external', x: 37, y: 84 },
    { id: 'unknown-b', name: 'UNKNOWN ENDPOINT', ip: '198.51.100.42', role: 'external', x: 88, y: 76 },
  ],
  connections: [
    { id: 'c01', source: '192.168.1.14', destination: '192.168.1.1', protocol: 'UDP', sourcePort: 5353, destinationPort: 5353, packets: 844, bytes: 128402, firstSeen: 0.4, lastSeen: 166.2, status: 'normal' },
    { id: 'c02', source: '192.168.1.14', destination: '8.8.8.8', protocol: 'DNS', sourcePort: 53124, destinationPort: 53, packets: 366, bytes: 48214, firstSeen: 2.1, lastSeen: 159.7, status: 'normal' },
    { id: 'c03', source: '192.168.1.14', destination: '1.1.1.1', protocol: 'DNS', sourcePort: 53902, destinationPort: 53, packets: 612, bytes: 79560, firstSeen: 4.8, lastSeen: 164.1, status: 'normal' },
    { id: 'c04', source: '192.168.1.14', destination: '140.82.112.4', protocol: 'TLS', sourcePort: 51148, destinationPort: 443, packets: 522, bytes: 684112, firstSeen: 11.2, lastSeen: 156.4, status: 'normal' },
    { id: 'c05', source: '192.168.1.14', destination: '34.120.54.55', protocol: 'HTTPS', sourcePort: 51882, destinationPort: 443, packets: 274, bytes: 419706, firstSeen: 19.4, lastSeen: 161.9, status: 'normal' },
    { id: 'c06', source: '192.168.1.14', destination: '203.0.113.18', protocol: 'TCP', sourcePort: 52011, destinationPort: 8080, packets: 318, bytes: 201884, firstSeen: 27.8, lastSeen: 149.2, status: 'normal' },
    { id: 'c07', source: '192.168.1.14', destination: '198.51.100.42', protocol: 'UDP', sourcePort: 54910, destinationPort: 123, packets: 147, bytes: 18406, firstSeen: 1.2, lastSeen: 138.5, status: 'normal' },
    { id: 'c08', source: '192.168.1.1', destination: '8.8.8.8', protocol: 'UDP', sourcePort: 49172, destinationPort: 53, packets: 281, bytes: 33982, firstSeen: 6.1, lastSeen: 151.6, status: 'normal' },
    { id: 'c09', source: '140.82.112.4', destination: '34.120.54.55', protocol: 'HTTPS', sourcePort: 443, destinationPort: 52630, packets: 413, bytes: 528744, firstSeen: 34.6, lastSeen: 158.3, status: 'normal' },
    { id: 'c10', source: '1.1.1.1', destination: '34.120.54.55', protocol: 'TCP', sourcePort: 443, destinationPort: 49812, packets: 229, bytes: 169248, firstSeen: 44.2, lastSeen: 143.8, status: 'normal' },
    { id: 'c11', source: '203.0.113.18', destination: '198.51.100.42', protocol: 'TLS', sourcePort: 443, destinationPort: 51442, packets: 275, bytes: 347920, firstSeen: 52.7, lastSeen: 162.5, status: 'normal' },
  ],
}
