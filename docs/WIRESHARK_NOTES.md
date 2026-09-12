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