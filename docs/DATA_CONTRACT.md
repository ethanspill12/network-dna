# Network DNA Data Contract

## Purpose

This document defines the packet and connection data structures that will be shared between the packet-processing side of Network DNA and the frontend visualization.

---

## Packet

A Packet represents one normalized network packet extracted from a PCAP or PCAPNG file.

Example:

```json
{
  "timestamp": 1.532,
  "source": "192.168.1.14",
  "destination": "8.8.8.8",
  "protocol": "UDP",
  "sourcePort": 53124,
  "destinationPort": 53,
  "length": 74
}
```

### Fields

* `timestamp`

  * Time in seconds relative to the beginning of the capture.

* `source`

  * Source IP address.

* `destination`

  * Destination IP address.

* `protocol`

  * Transport or application protocol used by the packet.

* `sourcePort`

  * Source TCP or UDP port when available.

* `destinationPort`

  * Destination TCP or UDP port when available.

* `length`

  * Total frame length in bytes.

---

## Connection

A Connection represents multiple packets grouped into one communication relationship.

Example:

```json
{
  "id": "connection-1",
  "source": "192.168.1.14",
  "destination": "8.8.8.8",
  "protocol": "DNS",
  "sourcePort": 53124,
  "destinationPort": 53,
  "packets": 87,
  "bytes": 14532,
  "firstSeen": 1.532,
  "lastSeen": 48.13,
  "riskScore": 4,
  "status": "normal"
}
```

### Fields

* `id`

  * Unique identifier for the connection.

* `source`

  * Source IP address.

* `destination`

  * Destination IP address.

* `protocol`

  * Protocol associated with the communication.

* `sourcePort`

  * Source port when available.

* `destinationPort`

  * Destination port when available.

* `packets`

  * Number of packets included in the connection.

* `bytes`

  * Total number of bytes transferred by the packets in the connection.

* `firstSeen`

  * Timestamp of the first packet in the connection.

* `lastSeen`

  * Timestamp of the last packet in the connection.

* `riskScore`

  * Numeric score used later for visualization and investigation.

* `status`

  * Current classification, such as `normal` or `suspicious`.

---

## Packet Aggregation

Network DNA should not create one DNA rung for every packet.

Packets should be grouped into communication relationships.

Conceptually:

```text
Packets
   ↓
Same source/destination relationship
   ↓
Same protocol and relevant ports
   ↓
Aggregate counts and timing
   ↓
Connection
```

A connection can therefore summarize:

* how many packets were exchanged
* how many bytes were transferred
* when communication started
* when communication ended
* which endpoints communicated
* which protocol and ports were involved

The frontend should primarily visualize Connections rather than individual Packets.
