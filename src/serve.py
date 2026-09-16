#!/usr/bin/env python3
"""Local-only static preview, no build step, accounts, or external requests."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import threading
import webbrowser

ROOT = Path(__file__).resolve().parents[1]

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(Handler, directory=str(ROOT)))
    address = f"http://127.0.0.1:{server.server_port}/"
    print(f"Doppler local preview: {address}", flush=True)
    print("This serves the extracted folder only on your computer. Press Control+C to stop.", flush=True)
    threading.Timer(0.6, lambda: webbrowser.open(address)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nPreview stopped.")
    finally:
        server.server_close()
