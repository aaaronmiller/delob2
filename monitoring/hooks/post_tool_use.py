#!/usr/bin/env python3
"""
Post Tool Use Hook

Inspired by: multi-agent-workflow by Apolo Pena
https://github.com/apolopena/multi-agent-workflow

Triggered after Claude Code uses a tool.
Sends event to monitoring server with tool usage data.
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
        # Read hook data from stdin
        hook_data = json.loads(sys.stdin.read()) if not sys.stdin.isatty() else {}

        # Extract tool information
        tool_name = hook_data.get('tool_name', 'unknown')
        tool_input = hook_data.get('tool_input', {})
        tool_result = hook_data.get('tool_result', {})

        # Create event
        event = {
            'id': str(uuid.uuid4()),
            'type': 'tool_use',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'session_id': hook_data.get('session_id', str(uuid.uuid4())),
            'project_id': os.path.basename(os.getcwd()),
            'context': {
                'hook': 'post_tool_use',
                'tool_name': tool_name,
                'tool_input': tool_input,
                'success': not hook_data.get('error')
            }
        }

        # Send to monitoring server
        send_event(event)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)

if __name__ == '__main__':
    main()
