import http.server
import socketserver

PORT = 8000

# This tells it to serve files from the current folder
Handler = http.server.SimpleHTTPRequestHandler

# This prevents the "Address already in use" error if you restart it fast
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Server started at port {PORT}")
    print(f"Local Link: http://localhost:{PORT}")
    print("Keep this window open to keep the site online!")
    httpd.serve_forever()