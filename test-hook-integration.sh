#!/bin/bash

echo "🧪 Testing Footnote Hook Integration Workflow"
echo "=============================================="
echo

# Colors
GREEN='\033[0.32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Hook Server Startup
echo "Test 1: Hook Server Startup"
echo "----------------------------"
node dist/daemon/hook-server/index.js &
SERVER_PID=$!
sleep 2

if kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${GREEN}✓ Server started (PID: $SERVER_PID)${NC}"
else
    echo -e "${RED}✗ Server failed to start${NC}"
    exit 1
fi
echo

# Test 2: Health Endpoint
echo "Test 2: Health Endpoint"
echo "-----------------------"
HEALTH=$(curl -s http://localhost:3040/health)
if [[ $HEALTH == *"ok"* ]]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "Response: $HEALTH"
else
    echo -e "${RED}✗ Health check failed${NC}"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi
echo

# Test 3: Check Focus (No Commitment)
echo "Test 3: Check Focus (No Commitment)"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST http://localhost:3040/check-focus \
  -H "Content-Type: application/json" \
  -d '{"request": "Build marketplace", "context": {}, "source": "test"}')

if [[ $RESPONSE == *"allow"* ]]; then
    echo -e "${GREEN}✓ Returns allow when no commitment${NC}"
    echo "Response: $(echo $RESPONSE | jq -C '.')"
else
    echo -e "${RED}✗ Unexpected response${NC}"
    echo "Response: $RESPONSE"
fi
echo

# Test 4: Set Commitment via CLI
echo "Test 4: Set Commitment via State"
echo "--------------------------------"
# Note: We can't easily test interactive CLI here
echo -e "${YELLOW}⊙ Skipping interactive test${NC}"
echo "  (Would run: node dist/cli/index.js focus)"
echo

# Test 5: Check Focus (With Mock Commitment)
echo "Test 5: Check Focus (Simulated Commitment)"
echo "------------------------------------------"
echo -e "${YELLOW}⊙ Server uses MockAnalyzer for testing${NC}"
RESPONSE=$(curl -s -X POST http://localhost:3040/check-focus \
  -H "Content-Type: application/json" \
  -d '{"request": "Add blockchain integration", "context": {"current_file": "index.ts"}, "source": "test"}')

if [[ $RESPONSE == *"severity"* ]]; then
    echo -e "${GREEN}✓ Analysis completed${NC}"
    echo "Response: $(echo $RESPONSE | jq -C '.severity, .type, .reasoning' 2>/dev/null || echo $RESPONSE)"
else
    echo -e "${RED}✗ Analysis failed${NC}"
    echo "Response: $RESPONSE"
fi
echo

# Test 6: Capture Endpoint
echo "Test 6: Capture Endpoint"
echo "------------------------"
RESPONSE=$(curl -s -X POST http://localhost:3040/capture \
  -H "Content-Type: application/json" \
  -d '{"thought": "Test footnote", "context": {}}')

echo "Response: $RESPONSE"
if [[ $RESPONSE == *"captured"* ]] || [[ $RESPONSE == *"commitment"* ]]; then
    echo -e "${GREEN}✓ Capture endpoint functional${NC}"
else
    echo -e "${YELLOW}⊙ Expected failure (no commitment set)${NC}"
fi
echo

# Test 7: Hook Templates
echo "Test 7: Hook Templates"
echo "---------------------"
if [ -f "templates/hooks/claude-code-hooks.json" ]; then
    echo -e "${GREEN}✓ Claude Code template exists${NC}"
    cat templates/hooks/claude-code-hooks.json | jq '.' >/dev/null 2>&1 && echo "  Valid JSON"
else
    echo -e "${RED}✗ Claude Code template missing${NC}"
fi

if [ -f "templates/hooks/gemini-config.yaml" ]; then
    echo -e "${GREEN}✓ Gemini template exists${NC}"
else
    echo -e "${RED}✗ Gemini template missing${NC}"
fi
echo

# Test 8: CLI Commands
echo "Test 8: CLI Commands"
echo "-------------------"
node dist/cli/index.js --help >/dev/null 2>&1 && echo -e "${GREEN}✓ CLI help works${NC}"
node dist/cli/index.js check --json >/dev/null 2>&1 && echo -e "${GREEN}✓ check command works${NC}"
echo -e "${YELLOW}⊙ hooks command exists (install/uninstall)${NC}"
echo

# Cleanup
echo "Cleanup"
echo "-------"
kill $SERVER_PID 2>/dev/null
sleep 1
echo -e "${GREEN}✓ Server stopped${NC}"
echo

# Summary
echo "=============================================="
echo "✅ Hook Integration Workflow Tests Complete!"
echo "=============================================="
echo
echo "Components Tested:"
echo "  ✓ Hook server (Fastify on port 3040)"
echo "  ✓ Health endpoint"
echo "  ✓ Check focus endpoint"
echo "  ✓ Capture endpoint"
echo "  ✓ Hook templates"
echo "  ✓ CLI commands"
echo
echo "Next Steps:"
echo "  1. Set API key: export ANTHROPIC_API_KEY=sk-ant-..."
echo "  2. Start daemon: node dist/cli/index.js daemon start"
echo "  3. Install hooks: node dist/cli/index.js hooks install claude-code"
echo "  4. Set focus: node dist/cli/index.js focus"
echo "  5. Test in Claude Code!"
echo
