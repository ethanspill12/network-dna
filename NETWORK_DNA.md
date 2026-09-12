# NETWORK DNA

## Hackathon Project Specification

**Hackathon Theme:** Beyond the Feed  
**Build Window:** 24 hours  
**Team:** 2 people  
**Primary Goal:** Finish a polished, working project while learning practical Wireshark/network-analysis concepts.

---

# 1. Project Vision

## Network DNA

**Your network has a fingerprint.**

Network DNA is an interactive cybersecurity visualization that transforms packet-capture data into a living, explorable representation of network communication.

Traditional networking and cybersecurity tools often present information as feeds: packet tables, logs, alerts, events, telemetry, and thousands of rows of rapidly changing information.

Network DNA explores what network analysis can look like **Beyond the Feed**.

Instead of asking users to scroll through thousands of packets, Network DNA groups packet activity into communication relationships and transforms those relationships into an interactive 3D DNA structure.

The DNA becomes a visual fingerprint of network behavior.

Users can:
1. Observe network communication.
2. Generate the network's DNA.
3. Explore individual communication relationships.
4. Understand them in beginner-friendly language.
5. Decode the underlying technical information.
6. Learn how to investigate the same behavior in Wireshark.
7. Identify visual "mutations" representing behavior worth investigating.
8. Use an Attack Lab to learn how suspicious network behavior changes network traffic.

Network DNA is **not intended to replace Wireshark**. It is intended to help users understand what they are seeing and what they should investigate in Wireshark.

---

# 2. Theme: Beyond the Feed

Core message:

> Feeds aren't limited to social media. Developers, security analysts, and engineers spend enormous amounts of time looking through feeds of logs, packets, alerts, and telemetry.
>
> Network DNA asks what happens when we stop scrolling through network activity and instead transform it into an interactive structure humans can explore.

The experience should emphasize exploration over scrolling. Avoid designing the primary experience as a traditional vertically scrolling dashboard.

---

# 3. Primary User Experience

Main flow:

```text
CINEMATIC INTRO
      ↓
OBSERVE
      ↓
LOAD PCAP
      ↓
RECONSTRUCT NETWORK
      ↓
GENERATE DNA
      ↓
EXPLORE DNA
      ↓
DECODE CONNECTION
      ↓
WIRESHARK INVESTIGATION
```

Attack Lab flow:

```text
ATTACK LAB
      ↓
SELECT SCENARIO
      ↓
OBSERVE BEHAVIOR
      ↓
DNA MUTATION
      ↓
UNDERSTAND WHY
      ↓
DECODE
      ↓
INVESTIGATE IN WIRESHARK
```

---

# 4. Opening Experience

Use a hybrid cinematic/product opening.

Initial concept:

```text
NETWORK DNA

YOUR NETWORK HAS A FINGERPRINT.

See the structure behind your traffic.

[ LOAD CAPTURE ]

Future:
[ BEGIN LIVE CAPTURE ]
```

Use subtle motion in the background: particles, network pulses, faint connection lines, depth, and restrained glow.

The opening should quickly transition into the actual application. Do not build a long intro animation that delays use of the product.

---

# 5. Visual Direction

## Style

Cyberpunk cybersecurity interface:
- dark environment
- deep blacks
- cool cyan/white network structures
- subtle neon glow
- translucent HUD panels
- depth
- particles
- fine grid/network details
- smooth camera movement
- restrained glitch effects
- high-quality typography
- sophisticated motion

The interface should feel futuristic and intricate, but **not like a parody "Hollywood hacker" interface**. Visual effects must support information.

---

# 6. Network Observation

After loading a capture, reconstruct network communication visually before generating DNA.

Display endpoints as nodes and eventually packets as pulses traveling between endpoints.

A small HUD can show:

```text
CAPTURE

PACKETS        4,281
ENDPOINTS         17
CONNECTIONS       31
ANOMALIES          0
DURATION        2:47
```

The user should understand: **These machines communicated during this capture.**

---

# 7. PCAP Processing

PCAP/PCAPNG import is the FIRST real network-data target.

Do not begin with live capture.

Expected pipeline:

```text
.pcap / .pcapng
       ↓
TShark
       ↓
Packet fields
       ↓
Python backend
       ↓
Normalized packet data
       ↓
Connection aggregation
       ↓
Frontend visualization
```

Initial useful fields:
- timestamp
- source IP
- destination IP
- protocol
- source port
- destination port
- packet length

Do not attempt to parse every Wireshark field. Start small.

---

# 8. Technology Stack

## Frontend
- React
- TypeScript
- Vite
- Three.js
- React Three Fiber
- GSAP where useful for transitions

## Backend
- Python
- FastAPI
- TShark

Use the simplest implementation that produces the required experience. Avoid unnecessary dependencies and infrastructure.

---

# 9. Packet vs Connection Model

Individual packets should NOT each become DNA rungs.

```text
PACKETS
   ↓
AGGREGATION
   ↓
CONNECTIONS
   ↓
DNA STRUCTURE
```

Example connection:

```json
{
  "source": "192.168.1.14",
  "destination": "8.8.8.8",
  "protocol": "DNS",
  "sourcePort": 53124,
  "destinationPort": 53,
  "packets": 87,
  "bytes": 14532,
  "firstSeen": 12.42,
  "lastSeen": 48.13,
  "riskScore": 4,
  "status": "normal"
}
```

Packets can create moving pulses, frequency/activity, packet details, timing information, and traffic volume. The DNA primarily represents relationships.

---

# 10. DNA Visual Language

The DNA should be immediately recognizable as a double helix while looking cybernetic.

```text
DNA structure       Network communication fingerprint
DNA rung            Communication relationship
Packet pulse        Packet activity
Pulse frequency     Communication frequency
Rung thickness      Traffic volume (future/if practical)
Color               Risk/deviation
Mutation            Behavior deserving investigation
```

The DNA should not merely be decorative.

---

# 11. Generate Network DNA

The transition from network graph to DNA is one of the project's most important visual moments.

The user selects **GENERATE DNA**.

Ideally:
1. Existing network nodes begin moving.
2. Communication lines bend toward the center.
3. Relationships organize.
4. Camera position changes.
5. Lines rotate into a helix.
6. The network graph becomes the DNA.

The goal is for the object the user was observing to physically transform into the DNA rather than simply switching pages.

Do not jeopardize core functionality attempting an extremely complicated transformation.

---

# 12. DNA Interaction

Default behavior:
- slow automatic rotation
- subtle continuous motion
- packet pulses where practical

User interaction:
- drag to rotate
- zoom
- hover connection
- click connection

When the user interacts, automatic motion should yield naturally. When idle, the DNA can resume subtle movement.

---

# 13. Endpoint Identity

IP addresses remain fundamental to Network DNA. Always retain the IP.

When reliable information is available, supplement it:

```text
GOOGLE DNS
8.8.8.8
```

or:

```text
UNKNOWN ENDPOINT
185.xxx.xxx.xxx
```

Never invent endpoint identities.

---

# 14. Risk Color Philosophy

Do not overload color with too many meanings. Color should primarily communicate risk/deviation.

```text
NORMAL       cool cyan / white
LOW CONCERN  subtle green
SUSPICIOUS   amber
HIGH RISK    red
```

Protocol should not compete with risk coloring. Use text labels, icons, patterns, hover information, or metadata for protocol.

---

# 15. Important Security Principle

**RED DOES NOT MEAN "MALWARE CONFIRMED."**

Red means **INVESTIGATE**.

Prefer **Potential C2 Beaconing** over **C2 Malware Detected**.

Network DNA should explain why behavior was flagged and avoid overstating conclusions.

---

# 16. Progressive Disclosure

Network DNA should be beginner-friendly first while preserving technical depth.

Initial view:

```text
GOOGLE DNS

Your computer communicated with a DNS service.
DNS helps translate domain names into IP addresses.

STATUS
NORMAL

[ DECODE CONNECTION ]
```

Decode view:

```text
SOURCE
192.168.1.14

DESTINATION
8.8.8.8

PROTOCOL
UDP

DESTINATION PORT
53

PACKETS
87

DATA
14.2 KB
```

Then allow **OPEN PACKET DETAILS**.

Flow:

```text
SIMPLE EXPLANATION
       ↓
CONNECTION DETAILS
       ↓
PACKET INFORMATION
       ↓
WIRESHARK INVESTIGATION
```

---

# 17. Wireshark Learning / Decode Mode

Education is a core part of the product.

Example:

```text
FIND THIS IN WIRESHARK

ip.addr == 8.8.8.8
```

Provide **COPY FILTER** and optionally **WHY THIS FILTER?**

Explanation:

> `ip.addr` matches packets where this IP appears as either the source or destination.

Advanced examples can progressively narrow traffic:

```text
ip.addr == 203.0.113.42
ip.addr == 203.0.113.42 && tcp
ip.dst == 203.0.113.42 && tcp.dstport == 4444
```

Core philosophy:

> Network DNA does not replace Wireshark. It helps users understand what to investigate in Wireshark.

---

# 18. Network Mutation

Suspicious or meaningfully abnormal behavior appears as a **DNA mutation**.

```text
NORMAL DNA
    ↓
BEHAVIOR DEVIATION
    ↓
AMBER
    ↓
ADDITIONAL SUSPICIOUS SIGNALS
    ↓
RED
    ↓
DNA MUTATION DETECTED
```

Potential effects:
- affected DNA rung turns amber/red
- pulse behavior changes
- surrounding particles subtly react
- restrained HUD alert
- camera gently focuses toward mutation

Avoid excessive screen flashing or disruptive glitching.

---

# 19. Risk Engine

Initial anomaly detection should be simple and explainable.

Possible signals:
- unfamiliar external endpoint
- unusual destination port
- highly regular communication timing
- significant traffic-volume deviation
- repeated connection attempts
- known simulated malicious endpoint

Example:

```text
Potential C2 Beaconing

RISK SCORE
82 / 100

WHY THIS WAS FLAGGED

Interval regularity       HIGH
Unknown external host     YES
Unusual destination port  YES
Baseline deviation        HIGH
```

Do not build machine-learning threat detection during the initial hackathon implementation.

---

# 20. Attack Lab

Attack Lab is an educational simulation environment.

Long-term vision:

```text
ATTACK LAB

Learn what suspicious network behavior
looks like before you encounter it.

[ C2 BEACONING ]
[ PORT SCAN ]
[ DATA EXFILTRATION ]
```

## IMPORTANT

Implement **C2 BEACONING FIRST**.

Do not implement Port Scan or Data Exfiltration until C2 Beaconing works end-to-end.

Prepared demonstration PCAP data is preferable to arbitrary fake red animation.

---

# 21. First Attack Scenario: Potential C2 Beaconing

Use prepared/simulated packet-capture data representing a device repeatedly contacting an external endpoint at highly regular intervals.

```text
10:31:00  → external endpoint
10:31:05  → external endpoint
10:31:10  → external endpoint
10:31:15  → external endpoint
10:31:20  → external endpoint
```

Potential signals:
- highly regular interval
- repeated outbound communication
- unfamiliar destination
- unusual destination port
- deviation from baseline

Beginner explanation:

> A device is repeatedly communicating with the same external endpoint at unusually regular intervals.
>
> Automated software can produce patterns like this, including malware communicating with command-and-control infrastructure.
>
> This pattern does not prove the device is infected, but it deserves investigation.

---

# 22. Attack Lab Future Scenarios

Only after C2 works:

## Port Scan
A single source rapidly touches many destination ports.

## Data Exfiltration
A device that normally sends small amounts of data suddenly transfers a large volume to an unfamiliar external endpoint.

These are P2 until the primary experience works.

---

# 23. Timeline / Rewind

Desired feature:

```text
10:31:00 ━━━━━━━━━●━━━━━━━━━━━━ 10:36:00
                  ↑
              MUTATION
```

Users can move through capture time and observe how network behavior changes.

Pitch:

> Instead of scrolling through thousands of packets trying to determine when behavior changed, Network DNA lets you rewind the network's fingerprint.

This should not block the MVP.

---

# 24. Live Capture

Long-term goal:

```text
LIVE NETWORK
     ↓
TShark
     ↓
STREAMED PACKET DATA
     ↓
AGGREGATION
     ↓
NETWORK DNA
```

The helix would continuously evolve as network behavior changes.

**DO NOT implement live capture before PCAP import works reliably.**

---

# 25. Demo Story

Possible 2–3 minute demo:

1. Explain that security tools often present packet/log/alert feeds.
2. Load a known PCAP.
3. Reconstruct communication relationships.
4. Select **GENERATE NETWORK DNA**.
5. Explain that the DNA is a visual fingerprint of network relationships.
6. Click a normal connection.
7. Show beginner explanation, technical details, and a Wireshark filter.
8. Open Attack Lab.
9. Run C2 Beaconing scenario.
10. Show **DNA MUTATION DETECTED**.
11. Explain what changed and why it deserves investigation.
12. Close with:

> Network DNA isn't designed to replace Wireshark. It's designed to make network behavior understandable and help users know what to investigate next.

---

# 26. Hackathon Priorities

## P0 — MUST WORK

- Project runs reliably
- React/Vite frontend
- Cyberpunk visual foundation
- Mock packet/connection data
- Basic network visualization
- DNA visualization
- DNA uses connection data
- DNA interaction
- Click connection
- Beginner-friendly connection explanation
- Technical connection details
- Wireshark filter generation
- PCAP/PCAPNG import
- TShark extraction of selected fields
- FastAPI backend
- Real capture data reaches frontend
- Real capture data can generate DNA

Prioritize a complete end-to-end experience over adding features.

## P1 — MAKE THE DEMO GREAT

- polished network → DNA transformation
- animated packet pulses
- sophisticated hover effects
- connection highlighting
- excellent camera behavior
- C2 Beaconing Attack Lab
- explainable mutation detection
- mutation animation
- timeline/rewind if practical
- strong loading/processing animation
- polished HUD
- presentation-ready transitions

## P2 — ONLY IF AHEAD OF SCHEDULE

- Live capture
- Port Scan Attack Lab
- Data Exfiltration Attack Lab
- sophisticated baseline comparison
- endpoint enrichment
- additional protocol visualization
- advanced anomaly scoring
- advanced shaders
- complex particle systems
- additional educational lessons

---

# 27. Agent Development Rules

This document is the project's source of truth.

## Rule 1 — Work incrementally
Do not attempt to build the entire specification at once. Implement one checkpoint at a time.

## Rule 2 — Verify before continuing
After completing a checkpoint:
1. Run the project.
2. Check for errors.
3. Test the feature.
4. Fix failures.
5. Report what changed.
6. Stop before beginning a major new checkpoint unless explicitly instructed otherwise.

## Rule 3 — Preserve working functionality
Do not rewrite working systems unnecessarily. Prefer small targeted changes.

## Rule 4 — Avoid unnecessary dependencies
Before adding a package, determine whether the existing stack can accomplish the task.

## Rule 5 — Do not overengineer
This is a 24-hour hackathon. Prefer **simple + reliable + beautiful** over **architecturally perfect + unfinished**.

## Rule 6 — Keep security claims accurate
Never present heuristic network behavior as definitive proof of malware or compromise.

## Rule 7 — Teach while building
When implementing Wireshark/TShark functionality, briefly explain what field/filter is being used, what it means, and why Network DNA needs it.

## Rule 8 — Respect project priorities
P0 before P1. P1 before P2.

---

# 28. Agent Roles

## Codex
Primary implementation agent:
- creating files
- implementing features
- modifying code
- running the application
- fixing errors
- running tests
- targeted refactoring

## Claude Code
Reviewer / architecture / difficult-debugging agent:
- reviewing architecture
- reviewing targeted diffs
- identifying unnecessary complexity
- second opinions
- difficult debugging
- evaluating implementation approaches
- identifying edge cases

Preferred workflow:

```text
PLAN
  ↓
CODEX IMPLEMENTS
  ↓
RUN / TEST
  ↓
CLAUDE REVIEWS WHEN USEFUL
  ↓
TARGETED RECOMMENDATIONS
  ↓
CODEX FIXES
  ↓
VERIFY
```

Avoid having Codex and Claude independently rewrite the same feature simultaneously.

---

# 29. Token-Efficiency Rules

Agents should:
- Read this file for project context instead of repeatedly requesting the full project description.
- Inspect only files relevant to the current task.
- Avoid repeatedly summarizing the complete repository.
- Review targeted diffs/files rather than the entire project when possible.
- Keep explanations concise unless teaching/detail is requested.
- Avoid generating multiple alternative implementations unless asked.
- Do not regenerate working files unnecessarily.
- Use existing project structure whenever reasonable.

When a checkpoint is completed, update a concise project-status section so future agents do not need to reconstruct project history.

---

# 30. Project Status

## Current Phase
**Checkpoint 3A Complete — 3D Network DNA Prototype**

## Completed
- Project concept
- Theme positioning
- Primary UX
- DNA visual language
- Wireshark education concept
- Attack Lab concept
- Initial technology stack
- Feature priorities
- GitHub repository created
- React + TypeScript + Vite application initialized
- Responsive cyberpunk landing screen implemented
- Production build and local development server verified
- Landing-to-observation transition implemented
- Structured mock capture data with 8 endpoints and 11 aggregated connections
- Responsive network topology with varied packet-pulse animation
- Data-derived capture HUD and endpoint traffic isolation
- Future Generate Network DNA control staged without DNA functionality
- Dedicated interactive 3D Network DNA scene implemented
- Stable one-rung-per-connection mapping from mock capture data
- Two continuous cybernetic helix rails with activity-driven packet pulses
- Drag, touch, zoom, idle rotation, rung hover, and rung selection controls
- Lightweight selected-connection HUD and in-app return to observation
- Browser-level WebGL and interaction flow verified

## In Progress
- Awaiting explicit approval to begin Checkpoint 3B

## Next Checkpoint
Checkpoint 3B: topology-to-DNA transformation work only after explicit approval.

Do **NOT** begin topology-to-DNA morph or transformation work until Checkpoint 3B is explicitly approved.

---

# 31. North-Star Vision

The long-term version of Network DNA runs continuously against network traffic.

A living 3D helix represents communication relationships. Packets visibly move through the structure. Network behavior changes the DNA in real time.

Suspicious timing, endpoints, ports, traffic patterns, or other deviations create visible mutations.

A user can click any mutation and progressively explore:

- What happened?
- Why does it matter?
- Which connection caused it?
- What protocols and ports are involved?
- Which packets created this behavior?
- How can I investigate it in Wireshark?

Attack Lab lets users safely explore known suspicious network patterns and learn how those behaviors appear in packet captures.

Ultimate goal:

> Turn overwhelming network traffic into something humans can see, explore, understand, and learn from.

---

# 32. Guiding Principle

When deciding between features during the hackathon, ask:

> Does this make Network DNA more understandable, more visually compelling, more educational, or more demonstrably real?

If the answer is no, it probably does not belong in the 24-hour build.

**Finish the experience before expanding the experience.**
