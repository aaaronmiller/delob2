#!/usr/bin/env python3
"""
Subagent Stop Hook

Inspired by: multi-agent-workflow by Apolo Pena
https://github.com/apolopena/multi-agent-workflow

Triggered when a Claude Code subagent stops.
Sends event to monitoring server.
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
    except:
        return False

def main():
    """Main hook execution"""
    try:
        hook_data = json.loads(sys.stdin.read()) if not sys.stdin.isatty() else {}

        event = {
            'id': str(uuid.uuid4()),
            'type': 'subagent_stop',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'session_id': hook_data.get('session_id', str(uuid.uuid4())),
            'project_id': os.path.basename(os.getcwd()),
            'context': {
                'hook': 'subagent_stop',
                'subagent_id': hook_data.get('subagent_id'),
                'reason': hook_data.get('reason', 'unknown'),
                'data': hook_data
            }
        }

        send_event(event)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)

if __name__ == '__main__':
    main()
