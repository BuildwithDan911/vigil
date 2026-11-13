#!/usr/bin/env python3
"""
Vigil Web Server & InterSystems IRIS Reverse Proxy
Serves static web assets and proxies /vigil/api/* requests directly to InterSystems IRIS (port 52773).
"""
import http.server
import urllib.request
import urllib.error
import sys
import os

IRIS_BASE = os.environ.get("IRIS_BASE", "http://127.0.0.1:52773").rstrip("/")

class VigilProxyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS on all responses
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path.startswith("/vigil/api/"):
            self._proxy("GET")
        else:
            super().do_GET()

    def do_POST(self):
        if self.path.startswith("/vigil/api/"):
            self._proxy("POST")
        else:
            self.send_error(404, "Not Found")

    def _proxy(self, method):
        target_url = f"{IRIS_BASE}{self.path}"
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length) if content_length > 0 else None
            req = urllib.request.Request(target_url, data=body, method=method)
            req.add_header("Accept", "application/json")
            if body:
                req.add_header("Content-Type", "application/json")
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = resp.read()
                self.send_response(resp.status)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as he:
            err_data = he.read()
            self.send_response(he.code)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(err_data if err_data else f'{{"error":"{he.reason}"}}'.encode())
        except Exception as e:
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(f'{{"error":"IRIS Container proxy unavailable: {e}"}}'.encode())

if __name__ == "__main__":
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    server = http.server.HTTPServer(("0.0.0.0", port), VigilProxyHandler)
    print(f"Vigil Web Server & IRIS Proxy listening on http://localhost:{port} (Proxying to {IRIS_BASE})")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
