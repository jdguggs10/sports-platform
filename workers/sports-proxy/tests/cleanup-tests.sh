#!/bin/bash

# Cleanup script for consolidated test structure
# Removes the original 5 test files that have been consolidated

echo "🧹 Cleaning up old test files..."

# Backup old files (just in case)
mkdir -p tests/legacy-backup
mv test-responses-api.js tests/legacy-backup/ 2>/dev/null
mv test-responses-api-complete.js tests/legacy-backup/ 2>/dev/null  
mv test-hybrid-enhanced.js tests/legacy-backup/ 2>/dev/null
mv test-local.js tests/legacy-backup/ 2>/dev/null
mv test-openai-mcp.js tests/legacy-backup/ 2>/dev/null
mv tests/test-utils-broken.js tests/legacy-backup/ 2>/dev/null

echo "✅ Legacy test files moved to tests/legacy-backup/"
echo "📊 Consolidated test structure is now active"
echo ""
echo "Available commands:"
echo "  npm test              # Run all test suites"
echo "  npm run test:unit     # Run unit tests only"
echo "  npm run test:integration  # Run integration tests (requires local worker)"
echo "  npm run test:e2e      # Run e2e tests (requires OpenAI API key)"
echo ""
echo "🎉 Test consolidation complete!"
