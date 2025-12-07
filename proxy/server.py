#!/usr/bin/env python3
"""
Delobotomize API Proxy

Inspired by: claude-code-proxy by Aaron Miller
https://github.com/aaronmiller/claude-code-proxy

A simple proxy server that intercepts Anthropic API calls and logs them.
Logs are written in TSV format to proxy.log for analysis.

Usage:
    python proxy/server.py

Environment Variables:
    ANTHROPIC_API_KEY    - Your Anthropic API key
    PROXY_PORT           - Port to listen on (default: 8082)
    PROXY_LOG_PATH       - Path to log file (default: .delobotomize/proxy.log)
    ANTHROPIC_BASE_URL   - Anthropic API base URL (default: https://api.anthropic.com)
"""

import os
import sys
import time
import json
import logging
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
import uuid

# Configuration
PORT = int(os.getenv('PROXY_PORT', '8082'))
LOG_PATH = os.getenv('PROXY_LOG_PATH', '.delobotomize/proxy.log')
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')
ANTHROPIC_BASE_URL = os.getenv('ANTHROPIC_BASE_URL', 'https://api.anthropic.com')

# Ensure log directory exists
os.makedirs(os.path.dirname(LOG_PATH) if os.path.dirname(LOG_PATH) else '.', exist_ok=True)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ProxyHandler(BaseHTTPRequestHandler):
    """HTTP request handler that proxies to Anthropic API"""

    # Suppress default logging
    def log_message(self, format, *args):
        pass

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, anthropic-version')
        self.end_headers()

    def do_POST(self):
        """Handle POST requests to /v1/messages"""
        if self.path.startswith('/v1/messages'):
            self.proxy_request()
        else:
            self.send_error(404, 'Not Found')

    def proxy_request(self):
        """Proxy the request to Anthropic API and log it"""
        session_id = self.headers.get('X-Session-ID', str(uuid.uuid4()))
        start_time = time.time()

        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            request_data = json.loads(body) if body else {}

            # Build upstream request
            upstream_url = f"{ANTHROPIC_BASE_URL}{self.path}"
            headers = {
                'Content-Type': 'application/json',
                'anthropic-version': self.headers.get('anthropic-version', '2023-06-01'),
                'x-api-key': ANTHROPIC_API_KEY
            }

            # Make upstream request
            req = Request(
                upstream_url,
                data=body,
                headers=headers,
                method='POST'
            )

            try:
                with urlopen(req, timeout=120) as response:
                    status_code = response.status

                    # Copy headers
                    self.send_response(status_code)
                    for key, value in response.headers.items():
                        if key.lower() not in ['content-encoding', 'content-length', 'transfer-encoding', 'connection']:
                            self.send_header(key, value)
                    
                    # Forward Content-Length if present
                    content_len = response.headers.get('Content-Length')
                    if content_len:
                        self.send_header('Content-Length', content_len)
                    
                    self.end_headers()
                    
                    # Stream content
                    response_data = b""
                    while True:
                        chunk = response.read(8192) # 8KB chunks
                        if not chunk:
                            break
                        self.wfile.write(chunk)
                        self.wfile.flush()
                        response_data += chunk

                    response_json = json.loads(response_data)

                    # Extract token counts
                    usage = response_json.get('usage', {})
                    prompt_tokens = usage.get('input_tokens', 0)
                    completion_tokens = usage.get('output_tokens', 0)

                    # Handle reasoning tokens (if available in extended thinking)
                    reasoning_tokens = 0
                    for content_block in response_json.get('content', []):
                        if content_block.get('type') == 'thinking':
                            # Estimate reasoning tokens (rough approximation)
                            thinking_text = content_block.get('thinking', '')
                            reasoning_tokens += len(thinking_text.split()) * 1.3

                    reasoning_tokens = int(reasoning_tokens)

                    # Calculate cost (example pricing - adjust as needed)
                    model = request_data.get('model', 'claude-3-5-sonnet-20241022')
                    cost = self.calculate_cost(
                        model,
                        prompt_tokens,
                        completion_tokens,
                        reasoning_tokens
                    )

                    # Calculate latency
                    latency_ms = int((time.time() - start_time) * 1000)

                    # Log to TSV file
                    self.log_to_file(
                        session_id=session_id,
                        method=f"{self.command} {self.path}",
                        status=status_code,
                        prompt_tokens=prompt_tokens,
                        completion_tokens=completion_tokens,
                        reasoning_tokens=reasoning_tokens,
                        latency_ms=latency_ms,
                        model=model,
                        cost=cost
                    )

                    # Send response to client
                    self.send_response(status_code)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(response_data)

                    logger.info(f"✓ {status_code} {self.path} - {latency_ms}ms - ${cost:.4f}")

            except HTTPError as e:
                # Handle API errors
                error_body = e.read()
                self.send_response(e.code)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(error_body)

                # Log error
                latency_ms = int((time.time() - start_time) * 1000)
                self.log_to_file(
                    session_id=session_id,
                    method=f"{self.command} {self.path}",
                    status=e.code,
                    prompt_tokens=0,
                    completion_tokens=0,
                    reasoning_tokens=0,
                    latency_ms=latency_ms,
                    model=request_data.get('model', 'unknown'),
                    cost=0.0
                )

                logger.error(f"✗ {e.code} {self.path} - {latency_ms}ms")

        except Exception as e:
            logger.error(f"Proxy error: {e}")
            self.send_error(500, str(e))

    def calculate_cost(self, model: str, prompt_tokens: int, completion_tokens: int, reasoning_tokens: int) -> float:
        """Calculate cost based on token usage"""
        # Example pricing (adjust to actual Anthropic pricing)
        pricing = {
            'claude-3-5-sonnet-20241022': {'input': 3.00, 'output': 15.00},
            'claude-3-5-sonnet-20240620': {'input': 3.00, 'output': 15.00},
            'claude-3-opus-20240229': {'input': 15.00, 'output': 75.00},
            'claude-3-haiku-20240307': {'input': 0.25, 'output': 1.25},
        }

        # Default pricing if model not found
        prices = pricing.get(model, {'input': 3.00, 'output': 15.00})

        # Calculate cost per million tokens
        input_cost = (prompt_tokens + reasoning_tokens) * prices['input'] / 1_000_000
        output_cost = completion_tokens * prices['output'] / 1_000_000

        return input_cost + output_cost

    def log_to_file(self, session_id: str, method: str, status: int,
                   prompt_tokens: int, completion_tokens: int, reasoning_tokens: int,
                   latency_ms: int, model: str, cost: float):
        """Write log entry in TSV format"""
        timestamp = datetime.utcnow().isoformat() + 'Z'

        # TSV format: timestamp | session_id | method | status | prompt_tokens |
        #             completion_tokens | reasoning_tokens | latency_ms | model | cost
        log_line = '\t'.join([
            timestamp,
            session_id,
            method,
            str(status),
            str(prompt_tokens),
            str(completion_tokens),
            str(reasoning_tokens),
            str(latency_ms),
            model,
            f"{cost:.4f}"
        ])

        try:
            with open(LOG_PATH, 'a') as f:
                f.write(log_line + '\n')
        except Exception as e:
            logger.error(f"Failed to write log: {e}")


def main():
    """Start the proxy server"""
    if not ANTHROPIC_API_KEY:
        logger.error("ERROR: ANTHROPIC_API_KEY environment variable not set")
        sys.exit(1)

    logger.info("=" * 60)
    logger.info("Delobotomize API Proxy")
    logger.info("Inspired by claude-code-proxy by Aaron Miller")
    logger.info("=" * 60)
    logger.info(f"Port: {PORT}")
    logger.info(f"Log file: {LOG_PATH}")
    logger.info(f"Upstream: {ANTHROPIC_BASE_URL}")
    logger.info("=" * 60)
    logger.info("\nTo use with Claude Code:")
    logger.info(f"  export ANTHROPIC_API_BASE_URL=http://localhost:{PORT}")
    logger.info("")

    try:
        server = HTTPServer(('127.0.0.1', PORT), ProxyHandler)
        logger.info(f"🚀 Proxy server running at http://127.0.0.1:{PORT}\n")
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("\n\n👋 Shutting down proxy server...")
        server.shutdown()
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
