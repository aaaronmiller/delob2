#!/usr/bin/env python3
"""
Session Start Hook for Delobotomize

Triggered when a Claude Code session starts.
Sends session initialization event to monitoring server.
"""

import sys
import json
import urllib.request
import urllib.error
import os
from datetime import datetime
import uuid

def send_event(event_data):
    """Send event to monitoring server"""
    server_url = os.getenv('DELOBOTOMIZE_SERVER_URL', 'http://localhost:4000')
    timeout = int(os.getenv('DELOBOTOMIZE_TIMEOUT', '5'))

    try:
        req = urllib.request.Request(
            f'{server_url}/api/events',
            data=json.dumps(event_data).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )

        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.status == 200
    except Exception as e:
        # Fail silently - don't block Claude Code
        print(f"Warning: Could not send event to monitoring server: {e}", file=sys.stderr)
        return False

def main():
    """Main hook execution"""
    try:
        # Read hook data from stdin (if available)
        hook_data = {}
        if not sys.stdin.isatty():
            try:
                hook_data = json.loads(sys.stdin.read())
            except:
                pass

        # Get session info from environment
        session_id = os.getenv('CLAUDE_SESSION_ID', str(uuid.uuid4()))
        project_root = os.getcwd()
        project_name = os.path.basename(project_root)

        # Create session start event
        event = {
            'id': str(uuid.uuid4()),
            'type': 'session_start',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'session_id': session_id,
            'project_id': project_name,
            'context': {
                'hook': 'session_start',
                'project_root': project_root,
                'user': os.getenv('USER', 'unknown'),
                'cwd': os.getcwd()
            }
        }

        # Send to monitoring server
        success = send_event(event)

        if success:
            print(f"✓ Session started: {session_id[:12]}...", file=sys.stderr)

    except Exception as e:
        # Fail silently - don't block Claude Code
        print(f"Error in session_start hook: {e}", file=sys.stderr)

if __name__ == '__main__':
    main()
