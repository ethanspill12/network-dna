from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware

from scripts.tshark_extract import (
    aggregate_packets,
    build_capture_output,
    parse_packets,
    run_tshark,
)


ALLOWED_SUFFIXES = {".pcap", ".pcapng"}
MAX_UPLOAD_BYTES = 250 * 1024 * 1024
UPLOAD_TEMP_ROOT = Path(__file__).resolve().parent / ".uploads"

app = FastAPI(title="Network DNA Capture API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


def analyze_capture(capture_path: str):
    raw_output = run_tshark(capture_path)
    packets = parse_packets(raw_output)
    connections = aggregate_packets(packets)

    if not connections:
        raise ValueError(
            "No supported IPv4 TCP or UDP conversations were found in this capture."
        )

    return build_capture_output(capture_path, connections)


@app.get("/api/health")
def health():
    return {"status": "ready"}


@app.post("/api/captures")
async def upload_capture(file: UploadFile = File(...)):
    original_name = Path(file.filename or "capture").name
    suffix = Path(original_name).suffix.lower()

    if suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(
            status_code=415,
            detail="Choose a .pcap or .pcapng capture file.",
        )

    try:
        UPLOAD_TEMP_ROOT.mkdir(exist_ok=True)
        capture_path = UPLOAD_TEMP_ROOT / f"{uuid4().hex}{suffix}"
        uploaded_bytes = 0

        with capture_path.open("wb") as temporary_file:
            while chunk := await file.read(1024 * 1024):
                uploaded_bytes += len(chunk)
                if uploaded_bytes > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail="Capture is larger than the 250 MB local demo limit.",
                    )
                temporary_file.write(chunk)

        if uploaded_bytes == 0:
            raise HTTPException(status_code=400, detail="The selected capture is empty.")

        try:
            output = await run_in_threadpool(analyze_capture, str(capture_path))
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error)) from error
        except RuntimeError as error:
            raise HTTPException(
                status_code=422,
                detail=f"Capture analysis failed: {error}",
            ) from error

        output["filename"] = original_name
        return output
    except OSError as error:
        raise HTTPException(
            status_code=500,
            detail=f"The temporary capture could not be processed: {error}",
        ) from error
    finally:
        if "capture_path" in locals():
            capture_path.unlink(missing_ok=True)
        await file.close()
