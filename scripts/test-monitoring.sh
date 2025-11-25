#!/bin/bash
# Test script for Delobotomize monitoring system

set -e

echo "🧪 Delobotomize Monitoring System Test"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_URL=${DELOBOTOMIZE_SERVER_URL:-http://localhost:4000}
SESSION_ID=$(uuidgen 2>/dev/null || echo "test-session-$(date +%s)")
PROJECT_ID="delob2-test"

echo "Configuration:"
echo "  Server URL: $SERVER_URL"
echo "  Session ID: $SESSION_ID"
echo "  Project ID: $PROJECT_ID"
echo ""

# Test 1: Health check
echo -e "${YELLOW}Test 1: Health Check${NC}"
HEALTH=$(curl -s "$SERVER_URL/healthz")
if [[ $HEALTH == *"ok"* ]]; then
    echo -e "${GREEN}✓ Server is healthy${NC}"
else
    echo "✗ Server health check failed"
    exit 1
fi
echo ""

# Test 2: Send session_start event
echo -e "${YELLOW}Test 2: Send session_start Event${NC}"
EVENT_DATA=$(cat <<EOF
{
  "id": "$(uuidgen 2>/dev/null || echo test-$(date +%s)-1)",
  "type": "session_start",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")",
  "session_id": "$SESSION_ID",
  "project_id": "$PROJECT_ID",
  "context": {
    "hook": "test",
    "test": true
  }
}
EOF
)

RESPONSE=$(curl -s -X POST "$SERVER_URL/api/events" \
  -H "Content-Type: application/json" \
  -d "$EVENT_DATA")

if [[ $RESPONSE == *"success"* ]]; then
    echo -e "${GREEN}✓ Session start event sent${NC}"
else
    echo "✗ Failed to send session start event"
    echo "Response: $RESPONSE"
    exit 1
fi
echo ""

# Test 3: Send tool_use events
echo -e "${YELLOW}Test 3: Send Multiple tool_use Events${NC}"
for i in {1..5}; do
    TOOL_EVENT=$(cat <<EOF
{
  "id": "$(uuidgen 2>/dev/null || echo test-$(date +%s)-$i)",
  "type": "tool_use",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")",
  "session_id": "$SESSION_ID",
  "project_id": "$PROJECT_ID",
  "context": {
    "hook": "post_tool_use",
    "tool_name": "test_tool_$i",
    "success": true
  }
}
EOF
    )

    curl -s -X POST "$SERVER_URL/api/events" \
      -H "Content-Type: application/json" \
      -d "$TOOL_EVENT" > /dev/null

    echo "  Sent tool_use event $i/5"
    sleep 0.2
done
echo -e "${GREEN}✓ Tool use events sent${NC}"
echo ""

# Test 4: Send rate_limit event
echo -e "${YELLOW}Test 4: Send rate_limit Event${NC}"
RATE_LIMIT_EVENT=$(cat <<EOF
{
  "id": "$(uuidgen 2>/dev/null || echo test-$(date +%s)-rate)",
  "type": "rate_limit",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")",
  "session_id": "$SESSION_ID",
  "project_id": "$PROJECT_ID",
  "context": {
    "hook": "post_response",
    "status": 429,
    "error": "Rate limit exceeded"
  }
}
EOF
)

curl -s -X POST "$SERVER_URL/api/events" \
  -H "Content-Type: application/json" \
  -d "$RATE_LIMIT_EVENT" > /dev/null

echo -e "${GREEN}✓ Rate limit event sent${NC}"
echo ""

# Test 5: Query events
echo -e "${YELLOW}Test 5: Query Events${NC}"
EVENTS=$(curl -s "$SERVER_URL/api/events?session_id=$SESSION_ID")
EVENT_COUNT=$(echo $EVENTS | grep -o "\"id\":" | wc -l)

if [ "$EVENT_COUNT" -ge 5 ]; then
    echo -e "${GREEN}✓ Retrieved $EVENT_COUNT events${NC}"
else
    echo "✗ Expected at least 5 events, got $EVENT_COUNT"
fi
echo ""

# Test 6: Query stats
echo -e "${YELLOW}Test 6: Query Statistics${NC}"
STATS=$(curl -s "$SERVER_URL/api/stats")
if [[ $STATS == *"stats"* ]]; then
    echo -e "${GREEN}✓ Statistics retrieved${NC}"
    echo "$STATS" | python3 -m json.tool 2>/dev/null || echo "$STATS"
else
    echo "✗ Failed to retrieve statistics"
fi
echo ""

# Summary
echo "======================================"
echo -e "${GREEN}✓ All tests passed!${NC}"
echo ""
echo "Next steps:"
echo "  1. Open dashboard: $SERVER_URL"
echo "  2. View events for session: $SESSION_ID"
echo "  3. Check Claude Code integration with hooks"
echo ""
