# Network DNA Data Contract

## Purpose

This document defines the normalized data structures shared between packet processing and the Network DNA frontend.

Raw packets remain directional.

Connections are bidirectional conversation-level relationships whenever both directions can reasonably be grouped together.

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

  * Source IP address.

* `destination`

  * Destination IP address.

* `transportProtocol`

  * Transport-layer protocol such as `TCP` or `UDP`.

* `applicationProtocol`

  * Application-layer protocol when the capture establishes one, such as `DNS`, `TLS`, or `HTTP`.
  * Use `null` when it cannot be determined reliably.

* `sourcePort`

  * TCP or UDP source port when available.

* `destinationPort`

  * TCP or UDP destination port when available.

* `length`

  * Total frame length in bytes.

---

# Connection

A `Connection` represents one bidirectional TCP or UDP communication relationship.

Packets traveling from A to B and packets traveling from B back to A should be grouped into one Connection when they belong to the same conversation.

## Example

```json
{
  "id": "connection-1",
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

  "riskScore": 4,
  "status": "normal"
}
```

---

# Bidirectional Aggregation

The same conversation should not become two separate connections just because packets travel in both directions.

For example:

```text
192.168.1.14:53124 → 8.8.8.8:53
8.8.8.8:53 → 192.168.1.14:53124
```

should normally become one Connection.

A conversation can be normalized using:

```text
endpoint 1 IP
endpoint 1 port
endpoint 2 IP
endpoint 2 port
transport protocol
```

The endpoint ordering should be stable so the reverse direction maps to the same relationship.

Conceptually:

```text
Directional packets
        ↓
Normalize endpoint pair
        ↓
Group both directions
        ↓
One Connection
```

---

# Client and Server Roles

When client/server roles can be determined reasonably, use:

```text
clientIp
clientPort
serverIp
serverPort
```

Useful evidence may include:

* a known service port
* an ephemeral client port
* TCP connection establishment
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

Client/server roles should not be invented when the traffic does not provide enough evidence.

---

# Neutral Endpoint Roles

If client/server identity is ambiguous, preserve neutral endpoint roles instead.

Example fields:

```text
endpointAIp
endpointAPort
endpointBIp
endpointBPort
```

Directional statistics can then use:

```text
packetsAToB
packetsBToA
bytesAToB
bytesBToA
```

This is preferred over making an unsupported client/server assumption.

---

# Protocol Fields

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

Do not infer an application protocol only because a common port is being used.

For example, port `443` alone does not prove the traffic is TLS or HTTPS.

If the protocol cannot be established:

```json
"applicationProtocol": null
```

---

## displayProtocol

A frontend-friendly label.

Examples:

```text
DNS
HTTPS/TLS
TCP
UDP
UNKNOWN
```

It should be based on known information and should not overstate what the capture proves.

Example:

```text
transportProtocol = TCP
applicationProtocol = null
displayProtocol = TCP
```

---

# Directional Statistics

When client/server roles are known:

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

When roles are unknown, use equivalent A-to-B and B-to-A fields.

---

# Timing

Each Connection includes:

```text
firstSeen
lastSeen
```

* `firstSeen`

  * Timestamp of the earliest packet in the conversation.

* `lastSeen`

  * Timestamp of the latest packet in the conversation.

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
* IP addresses
* TCP/UDP ports
* transport information
* packet size

## Derived by Network DNA

The following are calculated during processing:

```text
connection id
bidirectional conversation grouping
client/server roles when inferable
neutral endpoint roles when not inferable
packet totals
byte totals
firstSeen
lastSeen
displayProtocol
```

## Application protocol

Application protocol is separate from transport protocol.

TShark can identify higher-level protocols through packet dissection, but Network DNA should only populate `applicationProtocol` when the capture provides enough evidence.

If it does not:

```json
"applicationProtocol": null
```

---

# Summary

Network DNA uses two levels of data:

```text
Packet
↓
directional raw packet

Connection
↓
normalized bidirectional relationship
```

The main aggregation rule is:

```text
A → B
+
B → A
=
one conversation whenever reasonably possible
```

Packets preserve exact direction.

Connections summarize both directions into one stable relationship for the frontend.
