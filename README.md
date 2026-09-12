# Network DNA

Interactive network traffic visualization using Wireshark and 3D Network DNA.

## Local setup

Install Wireshark so both `tshark` and `capinfos` are available on `PATH` (the standard Windows Wireshark installation path is also detected).

Backend:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r .\backend\requirements.txt
python -m uvicorn backend.main:app --reload
```

Frontend, in a second terminal:

```powershell
npm ci
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open `http://127.0.0.1:5173`. Port `5173` is required by the current local FastAPI CORS configuration. The frontend uses `http://127.0.0.1:8000` by default; set `VITE_API_URL` before starting Vite to use a different local API address.

Only `.pcap` and `.pcapng` uploads are accepted. Files are written under the backend's ignored temporary-upload directory and removed after each request.
