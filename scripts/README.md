# TShark Extraction Script

`tshark_extract.py` converts a PCAP or PCAPNG capture into normalized Network DNA JSON.

## Usage

```powershell
python .\scripts\tshark_extract.py <capture>
```

Example:

```powershell
python .\scripts\tshark_extract.py .\samples\pcaps\test.pcapng
```

To save the generated JSON:

```powershell
python .\scripts\tshark_extract.py .\samples\pcaps\test.pcapng -o .\samples\generated-test.json
```

## Requirements

* Python 3
* TShark / Wireshark

The script currently supports IPv4 TCP and UDP traffic.

It does not perform:

* anomaly detection
* live capture
* Attack Lab processing

FastAPI reuses these functions from `backend/main.py`; extraction and aggregation logic remains centralized in this script.
