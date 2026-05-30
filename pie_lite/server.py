import json
from dataclasses import asdict
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse

from .crm import update_stage


class PIEHandler(SimpleHTTPRequestHandler):
    """Serves static files from pie_lite/ and handles POST /move."""

    def __init__(self, *args, **kwargs):
        # Serve from the directory containing this script (pie_lite/)
        self.directory = str(Path(__file__).parent)
        super().__init__(*args, **kwargs)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/move":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            try:
                payload = json.loads(body)
                ref = payload.get("ref")
                stage = payload.get("stage")
                if not ref or not stage:
                    self.send_error(400, "Missing ref or stage")
                    return
                updated_lead = update_stage(ref, stage)
                response = json.dumps(asdict(updated_lead)).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(response)))
                self.end_headers()
                self.wfile.write(response)
            except ValueError as e:
                self.send_error(400, str(e))
            except Exception:
                self.send_error(500, "Internal server error")
        else:
            self.send_error(404, "Not found")

    def do_GET(self):
        super().do_GET()

    def log_message(self, format, *args):
        # Suppress noisy access log in interactive mode; keep errors
        if args and str(args[1]) not in ("200", "304"):
            super().log_message(format, *args)


def start_server(port: int = 8000):
    httpd = HTTPServer(("", port), PIEHandler)
    print(f"Dashboard available at http://localhost:{port}/dashboard.html")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        httpd.server_close()
