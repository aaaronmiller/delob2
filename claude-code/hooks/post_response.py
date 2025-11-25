#!/usr/bin/env python3
"""
Post Response Hook for Delobotomize

Triggered after Claude Code receives an API response.
Tracks response status and detects errors.
"""

import sys
import json
import urllib.request
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
        hook_data = {}
        if not sys.stdin.isatty():
            try:
                hook_data = json.loads(sys.stdin.read())
            except:
                pass

        session_id = os.getenv('CLAUDE_SESSION_ID', str(uuid.uuid4()))
        project_name = os.path.basename(os.getcwd())

        # Check for rate limits or errors
        status = hook_data.get('status', 200)
        event_type = 'api_response'

        if status == 429:
            event_type = 'rate_limit'
        elif status >= 400:
            event_type = 'api_error'

        event = {
            'id': str(uuid.uuid4()),
            'type': event_type,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'session_id': session_id,
            'project_id': project_name,
            'context': {
                'hook': 'post_response',
                'status': status,
                'error': hook_data.get('error')
            }
        }

        send_event(event)
    except:
        pass

if __name__ == '__main__':
    main()
