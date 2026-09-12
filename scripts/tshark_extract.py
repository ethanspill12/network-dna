import argparse
import csv
import json
import os
import shutil
import subprocess
import sys
from collections import defaultdict


TSHARK_FIELDS = [
    "frame.time_relative",
    "ip.src",
    "ip.dst",
    "ip.proto",
    "tcp.srcport",
    "tcp.dstport",
    "udp.srcport",
    "udp.dstport",
    "frame.len",
    "_ws.col.Protocol",
]


def find_tshark():
    tshark = shutil.which("tshark")

    if tshark:
        return tshark

    windows_path = r"C:\Program Files\Wireshark\tshark.exe"

    if os.path.exists(windows_path):
        return windows_path

    raise RuntimeError(
        "TShark was not found. Install Wireshark/TShark or add TShark to PATH."
    )


def run_tshark(capture_path):
    tshark = find_tshark()

    command = [
        tshark,
        "-r",
        capture_path,
        "-T",
        "fields",
        "-E",
        "separator=\t",
        "-E",
        "quote=d",
    ]

    for field in TSHARK_FIELDS:
        command.extend(["-e", field])

    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        error_message = result.stderr.strip()

        if not error_message:
            error_message = "TShark could not parse the capture."

        raise RuntimeError(error_message)

    return result.stdout


def parse_port(value):
    value = value.strip()

    if value == "":
        return None

    try:
        return int(value)
    except ValueError:
        return None


def parse_protocol(ip_proto, tcp_src, tcp_dst, udp_src, udp_dst):
    if tcp_src is not None or tcp_dst is not None or ip_proto == "6":
        return "TCP"

    if udp_src is not None or udp_dst is not None or ip_proto == "17":
        return "UDP"

    return None


def normalize_application_protocol(protocol_name):
    if not protocol_name:
        return None

    name = protocol_name.upper()

    known_protocols = {
        "DNS": "DNS",
        "TLSV1.2": "TLS",
        "TLSV1.3": "TLS",
        "TLS": "TLS",
        "HTTP": "HTTP",
        "HTTP2": "HTTP",
    }

    return known_protocols.get(name)


def parse_packets(raw_output):
    packets = []

    reader = csv.reader(raw_output.splitlines(), delimiter="\t", quotechar='"')

    for row in reader:
        if len(row) < len(TSHARK_FIELDS):
            continue

        timestamp_raw = row[0].strip()
        source = row[1].strip()
        destination = row[2].strip()
        ip_proto = row[3].strip()

        tcp_src = parse_port(row[4])
        tcp_dst = parse_port(row[5])
        udp_src = parse_port(row[6])
        udp_dst = parse_port(row[7])

        length_raw = row[8].strip()
        tshark_protocol = row[9].strip()

        # R5 is IPv4-only.
        if not source or not destination:
            continue

        try:
            timestamp = float(timestamp_raw)
            length = int(length_raw)
        except ValueError:
            continue

        transport_protocol = parse_protocol(
            ip_proto,
            tcp_src,
            tcp_dst,
            udp_src,
            udp_dst,
        )

        if transport_protocol not in ("TCP", "UDP"):
            continue

        if transport_protocol == "TCP":
            source_port = tcp_src
            destination_port = tcp_dst
        else:
            source_port = udp_src
            destination_port = udp_dst

        packet = {
            "timestamp": timestamp,
            "source": source,
            "destination": destination,
            "transportProtocol": transport_protocol,
            "applicationProtocol": normalize_application_protocol(
                tshark_protocol
            ),
            "sourcePort": source_port,
            "destinationPort": destination_port,
            "length": length,
        }

        packets.append(packet)

    return packets


def endpoint_key(ip, port):
    port_value = -1 if port is None else port
    return (ip, port_value)


def make_conversation_key(packet):
    endpoint_one = endpoint_key(
        packet["source"],
        packet["sourcePort"],
    )

    endpoint_two = endpoint_key(
        packet["destination"],
        packet["destinationPort"],
    )

    ordered = sorted([endpoint_one, endpoint_two])

    return (
        ordered[0],
        ordered[1],
        packet["transportProtocol"],
    )


def infer_roles(packets):
    first_packet = packets[0]

    source_ip = first_packet["source"]
    source_port = first_packet["sourcePort"]
    destination_ip = first_packet["destination"]
    destination_port = first_packet["destinationPort"]

    transport = first_packet["transportProtocol"]
    application = first_packet["applicationProtocol"]

    # Strong application-level evidence.
    if application == "DNS" and destination_port == 53:
        return {
            "roleModel": "client-server",
            "clientIp": source_ip,
            "clientPort": source_port,
            "serverIp": destination_ip,
            "serverPort": destination_port,
        }

    # TCP SYN without ACK gives useful connection-establishment evidence.
    # The current extraction does not include TCP flags, so this cannot
    # currently be used.

    # Use service-port evidence only when one side looks clearly like a
    # service endpoint and the other side uses a high ephemeral port.
    common_service_ports = {
        53,
        80,
        443,
        445,
        123,
    }

    if (
        destination_port in common_service_ports
        and source_port is not None
        and source_port >= 49152
    ):
        return {
            "roleModel": "client-server",
            "clientIp": source_ip,
            "clientPort": source_port,
            "serverIp": destination_ip,
            "serverPort": destination_port,
        }

    if (
        source_port in common_service_ports
        and destination_port is not None
        and destination_port >= 49152
    ):
        return {
            "roleModel": "client-server",
            "clientIp": destination_ip,
            "clientPort": destination_port,
            "serverIp": source_ip,
            "serverPort": source_port,
        }

    # If roles cannot be inferred confidently, use deterministic
    # endpoint A/B ordering.
    endpoints = [
        (source_ip, source_port),
        (destination_ip, destination_port),
    ]

    endpoints.sort(key=lambda item: endpoint_key(item[0], item[1]))

    return {
        "roleModel": "neutral",
        "endpointAIp": endpoints[0][0],
        "endpointAPort": endpoints[0][1],
        "endpointBIp": endpoints[1][0],
        "endpointBPort": endpoints[1][1],
    }


def choose_application_protocol(packets):
    values = [
        packet["applicationProtocol"]
        for packet in packets
        if packet["applicationProtocol"] is not None
    ]

    if not values:
        return None

    counts = defaultdict(int)

    for value in values:
        counts[value] += 1

    return max(counts, key=counts.get)


def aggregate_connection(connection_id, packets):
    packets = sorted(
        packets,
        key=lambda packet: packet["timestamp"],
    )

    role_info = infer_roles(packets)

    transport_protocol = packets[0]["transportProtocol"]
    application_protocol = choose_application_protocol(packets)

    if application_protocol is not None:
        display_protocol = application_protocol
    elif transport_protocol is not None:
        display_protocol = transport_protocol
    else:
        display_protocol = "UNKNOWN"

    connection = {
        "id": connection_id,
        **role_info,
        "transportProtocol": transport_protocol,
        "applicationProtocol": application_protocol,
        "displayProtocol": display_protocol,
        "packetsTotal": len(packets),
        "bytesTotal": sum(packet["length"] for packet in packets),
        "firstSeen": packets[0]["timestamp"],
        "lastSeen": packets[-1]["timestamp"],
        "riskScore": 0,
        "status": "normal",
    }

    if role_info["roleModel"] == "client-server":
        client_ip = role_info["clientIp"]
        client_port = role_info["clientPort"]
        server_ip = role_info["serverIp"]
        server_port = role_info["serverPort"]

        packets_client_to_server = 0
        packets_server_to_client = 0
        bytes_client_to_server = 0
        bytes_server_to_client = 0

        for packet in packets:
            if (
                packet["source"] == client_ip
                and packet["sourcePort"] == client_port
                and packet["destination"] == server_ip
                and packet["destinationPort"] == server_port
            ):
                packets_client_to_server += 1
                bytes_client_to_server += packet["length"]

            elif (
                packet["source"] == server_ip
                and packet["sourcePort"] == server_port
                and packet["destination"] == client_ip
                and packet["destinationPort"] == client_port
            ):
                packets_server_to_client += 1
                bytes_server_to_client += packet["length"]

        connection["packetsClientToServer"] = packets_client_to_server
        connection["packetsServerToClient"] = packets_server_to_client

        connection["bytesClientToServer"] = bytes_client_to_server
        connection["bytesServerToClient"] = bytes_server_to_client

    else:
        endpoint_a_ip = role_info["endpointAIp"]
        endpoint_a_port = role_info["endpointAPort"]
        endpoint_b_ip = role_info["endpointBIp"]
        endpoint_b_port = role_info["endpointBPort"]

        packets_a_to_b = 0
        packets_b_to_a = 0
        bytes_a_to_b = 0
        bytes_b_to_a = 0

        for packet in packets:
            if (
                packet["source"] == endpoint_a_ip
                and packet["sourcePort"] == endpoint_a_port
                and packet["destination"] == endpoint_b_ip
                and packet["destinationPort"] == endpoint_b_port
            ):
                packets_a_to_b += 1
                bytes_a_to_b += packet["length"]

            elif (
                packet["source"] == endpoint_b_ip
                and packet["sourcePort"] == endpoint_b_port
                and packet["destination"] == endpoint_a_ip
                and packet["destinationPort"] == endpoint_a_port
            ):
                packets_b_to_a += 1
                bytes_b_to_a += packet["length"]

        connection["packetsAToB"] = packets_a_to_b
        connection["packetsBToA"] = packets_b_to_a

        connection["bytesAToB"] = bytes_a_to_b
        connection["bytesBToA"] = bytes_b_to_a

    return connection


def aggregate_packets(packets):
    conversations = defaultdict(list)

    for packet in packets:
        key = make_conversation_key(packet)
        conversations[key].append(packet)

    connections = []

    sorted_keys = sorted(conversations.keys(), key=str)

    for index, key in enumerate(sorted_keys, start=1):
        connection = aggregate_connection(
            f"connection-{index}",
            conversations[key],
        )
        connections.append(connection)

    return connections


def build_capture_output(capture_path, packets, connections):
    if packets:
        first_timestamp = min(packet["timestamp"] for packet in packets)
        last_timestamp = max(packet["timestamp"] for packet in packets)
        duration = last_timestamp - first_timestamp
    else:
        duration = 0.0

    return {
        "filename": os.path.basename(capture_path),
        "duration": round(duration, 6),
        "connections": connections,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Convert a PCAP/PCAPNG file into Network DNA JSON."
    )

    parser.add_argument(
        "capture",
        help="Path to a .pcap or .pcapng file",
    )

    parser.add_argument(
        "-o",
        "--output",
        help="Optional output JSON file path",
    )

    args = parser.parse_args()

    capture_path = os.path.abspath(args.capture)

    if not os.path.exists(capture_path):
        print(
            f"Error: capture file does not exist: {capture_path}",
            file=sys.stderr,
        )
        sys.exit(1)

    try:
        raw_output = run_tshark(capture_path)
        packets = parse_packets(raw_output)
        connections = aggregate_packets(packets)

        output = build_capture_output(
            capture_path,
            packets,
            connections,
        )

    except RuntimeError as error:
        print(f"Error: {error}", file=sys.stderr)
        sys.exit(1)

    json_output = json.dumps(output, indent=2)

    if args.output:
        output_path = os.path.abspath(args.output)

        with open(output_path, "w", encoding="utf-8") as file:
            file.write(json_output)

        print(f"Saved JSON to: {output_path}")
        print(f"Packets processed: {len(packets)}")
        print(f"Connections produced: {len(connections)}")

    else:
        print(json_output)


if __name__ == "__main__":
    main()