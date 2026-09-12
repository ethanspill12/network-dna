# Wireshark / TShark Notes

## frame.time_relative

Meaning: Number of seconds since beginning of packet capturing.

Why Network DNA needs it:Needs timing info to understand when packets were sent and to detect patterns later like repeated comms at regular intervals.

Useful Wireshark filter: frame.time_relative

---

## ip.src

Meaning: The source IPv4 address of the device that sent the packet.

Why Network DNA needs it: Uses the source ip to identify which endpoint initiated/or sent network traffic

Useful Wireshark filter:ip.src == 192.168.1.10

---

## ip.dst

Meaning: destination of IPv4 address of the device recieving the packet. 

Why Network DNA needs it: Network DNA uses the destination IP to figure out which endpoint the traffic was sent to. 

Useful Wireshark filter: ip.dst == 8.8.8.8

---

## ip.proto

Meaning: Numeric value identifying protocol carried in the ip packet.

Why Network DNA needs it: Needs to know what type of communication occured (tcp or udp).

Useful Wireshark filter: ip.proto == 6

Note:
Protocol # 6 represents tcp and 17 is udp
---

## tcp.srcport

Meaning:tcp port used by sending device

Why Network DNA needs it:source port helps identify the tcp connection bwtween two endpoints

Useful Wireshark filter: tcp.srcport == 443

---

## tcp.dstport

Meaning:tcp port packets being sent to.

Why Network DNA needs it: destination port can help identify the type of service being contacted, like https.

Useful Wireshark filter: tcp.dstport == 443

---

## udp.srcport

Meaning: UDP port used by sending device

Why Network DNA needs it:source port helps identify UDP comm between endpoints

Useful Wireshark filter:udp.srcport == 5353

---

## udp.dstport

Meaning:udp port that packets sent to

Why Network DNA needs it: helps identify services using udp, like dns.

Useful Wireshark filter:udp.dstport == 53

---

## frame.len

Meaning:total length of captured network frame in bytes.

Why Network DNA needs it:can use packet size to see how much data is being transferred.

Useful Wireshark filter: frame.len > 1000




# R2 - TShark PCAP Extraction

## Test Capture

A small PCAPNG capture was created using normal browsing traffic and ping traffic.

Capture file:

`samples/pcaps/test.pcapng`

## Working TShark Command

```powershell
& "C:\Program Files\Wireshark\tshark.exe" -r ".\samples\pcaps\test.pcapng" -T fields -e frame.time_relative -e ip.src -e ip.dst -e ip.proto -e tcp.srcport -e tcp.dstport -e udp.srcport -e udp.dstport -e frame.len
```

## Command Options

### `-r`

Reads packets from an existing PCAP or PCAPNG capture file.

### `-T fields`

Tells TShark to output only selected packet fields instead of the normal packet summary.

### `-e`

Selects an individual Wireshark field to include in the output.

For example:

```text
-e ip.src
```

outputs the source IPv4 address.

## Extracted Fields

The command extracts:

* `frame.time_relative` — relative packet timestamp
* `ip.src` — source IPv4 address
* `ip.dst` — destination IPv4 address
* `ip.proto` — IP protocol number
* `tcp.srcport` — TCP source port
* `tcp.dstport` — TCP destination port
* `udp.srcport` — UDP source port
* `udp.dstport` — UDP destination port
* `frame.len` — frame length in bytes

## Test Result

The extraction worked successfully on the test capture.

Example TCP packet output showed:

```text
19.813837200    10.13.241.19    162.159.133.234    6    55310    443    54
```

Here, protocol number `6` represents TCP. The TCP source and destination ports are populated while the UDP port fields are blank.

Example UDP packet output showed protocol number `17`, with the UDP source and destination port fields populated while the TCP port fields were blank.

This means the future parser will need to handle missing TCP or UDP fields depending on which transport protocol a packet uses.
