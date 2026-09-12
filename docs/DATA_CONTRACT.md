# Network DNA Data Contract

## Purpose

This document defines the normalized data structures shared between packet processing and the Network DNA frontend.

Raw packets remain directional.

Connections represent bidirectional conversations whenever both directions can reasonably be grouped together.

---

# Packet

A `Packet` represents one normalized directional packet extracted from a PCAP or PCAPNG file.

```json
{
  "timestamp": 1.532,
  "source": "192.168.1.14",
  "destination": "8.8.8.8",
  "transportProtocol": "UDP",
  "applicationProtocol": "DNS",
  "sourcePort": 53124,
  "destinationPort": 53,
  "length": 74
}
```

## Packet Fields

* `timestamp`

  * Time in seconds relative to the beginning of the capture.

* `source`

  * Source IPv4 address.

* `destination`

  * Destination IPv4 address.

* `transportProtocol`

  * Transport-layer protocol such as `TCP` or `UDP`.

* `applicationProtocol`

  * Application-layer protocol when established by the capture, such as `DNS`, `TLS`, or `HTTP`.
  * Use `null` when it cannot be determined reliably.

* `sourcePort`

  * TCP or UDP source port.
  * Type: `integer | null`

* `destinationPort`

  * TCP or UDP destination port.
  * Type: `integer | null`

* `length`

  * Total frame length in bytes.

Packets remain directional because each packet has a sender and receiver.

---

# Connection

A `Connection` represents one normalized bidirectional TCP or UDP conversation.

Traffic from A to B and traffic from B to A should be grouped into one Connection when both directions belong to the same conversation.

Every Connection must include a `roleModel` value so consumers know which endpoint model is being used.

Allowed values:

```text
client-server
neutral
```

---

# Client-Server Connection

Use the `client-server` role model when client and server roles can be determined with reasonable confidence.

```json
{
  "id": "connection-1",
  "roleModel": "client-server",

  "clientIp": "192.168.1.14",
  "clientPort": 53124,
  "serverIp": "8.8.8.8",
  "serverPort": 53,

  "transportProtocol": "UDP",
  "applicationProtocol": "DNS",
  "displayProtocol": "DNS",

  "packetsTotal": 87,
  "packetsClientToServer": 42,
  "packetsServerToClient": 45,

  "bytesTotal": 14532,
  "bytesClientToServer": 6400,
  "bytesServerToClient": 8132,

  "firstSeen": 1.532,
  "lastSeen": 48.13,

  "riskScore": 0,
  "status": "normal"
}
```

Port fields have type:

```text
integer | null
```

This applies to:

```text
clientPort
serverPort
sourcePort
destinationPort
endpointAPort
endpointBPort
```

Unavailable ports should be represented as `null`.

---

# Neutral Connection

If client and server roles cannot be confidently determined, use the `neutral` role model.

```json
{
  "id": "connection-2",
  "roleModel": "neutral",

  "endpointAIp": "192.168.1.18",
  "endpointAPort": 42000,
  "endpointBIp": "198.51.100.175",
  "endpointBPort": 41000,

  "transportProtocol": "TCP",
  "applicationProtocol": null,
  "displayProtocol": "TCP",

  "packetsTotal": 18,
  "packetsAToB": 10,
  "packetsBToA": 8,

  "bytesTotal": 4500,
  "bytesAToB": 2800,
  "bytesBToA": 1700,

  "firstSeen": 18.750,
  "lastSeen": 27.490,

  "riskScore": 0,
  "status": "normal"
}
```

Neutral roles are preferred over inventing client/server identity.

---

# Bidirectional Aggregation

Network DNA should not create separate Connections solely because traffic changes direction.

For example:

```text
192.168.1.14:53124 → 8.8.8.8:53
8.8.8.8:53 → 192.168.1.14:53124
```

should normally become one Connection.

A TCP or UDP conversation can conceptually be identified using:

```text
endpoint 1 IP
endpoint 1 port
endpoint 2 IP
endpoint 2 port
transport protocol
```

The endpoint ordering must be normalized so reverse traffic maps to the same relationship.

Conceptually:

```text
Directional packets
        ↓
Identify endpoints and ports
        ↓
Normalize endpoint ordering
        ↓
Group both directions
        ↓
One Connection
```

---

# Stable Endpoint A/B Ordering

Neutral endpoint A/B ordering must be deterministic.

Once endpoint A and endpoint B have been selected for a Connection, their identities must remain fixed for the lifetime of that Connection.

A packet traveling in the reverse direction must not cause endpoint A and endpoint B to switch.

The exact deterministic ordering algorithm will be implemented during R5.

---

# Client and Server Determination

Client/server roles should only be assigned when the capture provides reasonable evidence.

Possible evidence includes:

* known service ports
* ephemeral client ports
* TCP connection-establishment behavior
* DNS request/response behavior
* protocol information from TShark

Example:

```text
192.168.1.14:53124 → 8.8.8.8:53
```

can reasonably be treated as:

```text
client = 192.168.1.14:53124
server = 8.8.8.8:53
```

because port 53 is a well-known DNS service port.

Port numbers alone should not always be treated as proof.

If roles are uncertain, use the neutral endpoint model instead.

---

# Fixed Client and Server Roles

Once client/server roles are inferred for a Connection, those roles remain fixed regardless of packet direction.

For example:

```text
client = 192.168.1.14:52100
server = 203.0.113.20:443
```

A later packet may travel:

```text
203.0.113.20:443 → 192.168.1.14:52100
```

but the roles remain:

```text
client = 192.168.1.14:52100
server = 203.0.113.20:443
```

The server port remains associated with the server endpoint even when examining server-to-client packets.

---

# Protocol Fields

Network DNA separates transport protocol, application protocol, and the protocol label displayed by the frontend.

## transportProtocol

Represents the transport-layer protocol.

Examples:

```text
TCP
UDP
```

This can usually be determined reliably from the capture.

---

## applicationProtocol

Represents the application-layer protocol when the capture establishes one.

Examples:

```text
DNS
TLS
HTTP
```

If the application protocol is unknown:

```json
"applicationProtocol": null
```

Network DNA must not assign an application protocol only because a common port is being used.

For example, port `443` alone does not prove the traffic is TLS or HTTPS.

---

## displayProtocol

`displayProtocol` is a frontend-friendly protocol label.

The fallback behavior is:

```text
applicationProtocol known
        ↓
use applicationProtocol

otherwise

transportProtocol known
        ↓
use transportProtocol

otherwise
        ↓
UNKNOWN
```

Examples:

```text
DNS
TLS
HTTP
TCP
UDP
UNKNOWN
```

`displayProtocol` must not introduce an application protocol that is not supported by the capture.

---

# Directional Statistics

When `roleModel` is `client-server`, use:

```text
packetsTotal
packetsClientToServer
packetsServerToClient

bytesTotal
bytesClientToServer
bytesServerToClient
```

The totals should satisfy:

```text
packetsTotal =
packetsClientToServer +
packetsServerToClient
```

and:

```text
bytesTotal =
bytesClientToServer +
bytesServerToClient
```

When `roleModel` is `neutral`, use:

```text
packetsTotal
packetsAToB
packetsBToA

bytesTotal
bytesAToB
bytesBToA
```

---

# Timing

Each Connection contains:

```text
firstSeen
lastSeen
```

* `firstSeen`

  * Timestamp of the earliest packet in the conversation.

* `lastSeen`

  * Timestamp of the latest packet in the conversation.

---

# Risk Score and Status

## riskScore

`riskScore` is an integer from:

```text
0–100
```

A higher score indicates behavior that deserves more investigation.

It does not prove malicious activity.

Before anomaly detection is implemented in R5, parser-generated Connections should default to:

```json
"riskScore": 0
```

---

## status

Allowed values are:

```text
normal
low-concern
suspicious
high-risk
```

Before anomaly detection exists, parser-generated Connections should default to:

```json
"status": "normal"
```

Mock Attack Lab or simulated suspicious data may intentionally use a non-normal status for frontend testing.

---

# TShark Data vs Derived Data

## Directly available from the current TShark extraction

```text
frame.time_relative
ip.src
ip.dst
ip.proto
tcp.srcport
tcp.dstport
udp.srcport
udp.dstport
frame.len
```

These provide:

* packet timing
* packet direction
* IPv4 addresses
* transport protocol information
* TCP/UDP ports
* packet size

---

## Derived by Network DNA

The following values are calculated during processing:

```text
connection id
roleModel
bidirectional conversation grouping
client/server roles when inferable
neutral endpoint ordering when roles are unclear
packet totals
byte totals
firstSeen
lastSeen
displayProtocol
riskScore
status
```

---

# Application Protocol Detection

Application protocol is separate from transport protocol.

TShark can identify many higher-level protocols through packet dissection, but Network DNA should populate `applicationProtocol` only when the capture provides sufficient evidence.

If not:

```json
"applicationProtocol": null
```

Port numbers may provide supporting context, but they should not automatically determine the application protocol.

---

# Capture-Level Envelope

The final parser output should include capture-level information around the Connection list.

Example:

```json
{
  "filename": "test.pcapng",
  "duration": 48.13,
  "connections": []
}
```

Fields:

* `filename`

  * Name of the source capture file.

* `duration`

  * Duration of the capture in seconds.

* `connections`

  * Array of normalized Connection objects.

Conceptually:

```text
Capture
├── filename
├── duration
└── connections[]
```

---

# R5 Scope

For the hackathon implementation, R5 will initially support IPv4 traffic.

Current address fields:

```text
ip.src
ip.dst
```

IPv6 support is considered future work and should not block the initial parser.

---

# Packet to Connection Flow

```text
PCAP / PCAPNG
      ↓
TShark
      ↓
Directional Packet records
      ↓
Normalize endpoint pair
      ↓
Group both directions
      ↓
Determine client/server when reasonably possible
      ↓
Otherwise use stable endpoint A/B roles
      ↓
Calculate packet, byte, and timing statistics
      ↓
Connection
      ↓
Capture envelope
      ↓
Network DNA frontend
```

---

# Summary

Network DNA uses two primary levels of network data.

## Packet

A Packet remains directional and preserves:

```text
source
destination
sourcePort
destinationPort
timestamp
transportProtocol
applicationProtocol when known
length
```

## Connection

A Connection represents one normalized bidirectional relationship.

Every Connection includes a `roleModel` that identifies whether it uses:

```text
client-server
```

or:

```text
neutral
```

Client/server or endpoint A/B roles remain stable throughout the conversation.

Unknown application protocols remain `null`, and the frontend protocol label falls back to the known transport protocol rather than guessing.

The core aggregation rule is:

```text
A → B
+
B → A
=
one conversation whenever reasonably possible
```
