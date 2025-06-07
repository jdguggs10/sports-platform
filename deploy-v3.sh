#!/bin/bash

# Deploy v3 Migration - Sport-Scoped Architecture
echo "🚀 Deploying Sports Proxy v3 Migration"
echo "========================================"

# Deploy baseball micro-servers first
echo "📦 Deploying Baseball micro-servers..."

cd /Users/geraldgugger/Code/baseball-stats-mcp
echo "  • Deploying baseball-stats-mcp..."
wrangler deploy

cd /Users/geraldgugger/Code/baseball-fantasy-mcp  
echo "  • Deploying baseball-fantasy-mcp..."
wrangler deploy

cd /Users/geraldgugger/Code/baseball-news-mcp
echo "  • Deploying baseball-news-mcp..."
wrangler deploy

# Deploy main sports-proxy with v3 service bindings
echo "📦 Deploying Sports Proxy v3..."
cd /Users/geraldgugger/Code/sports-proxy
wrangler deploy

echo ""
echo "✅ v3 Migration Deployment Complete!"
echo ""
echo "🎯 Key Features Deployed:"
echo "  • Sport-scoped tool selection (≤3 tools per request)"
echo "  • Meta-tool façades (baseball.stats, baseball.fantasy, baseball.news)"
echo "  • Zero-latency Service Bindings"
echo "  • Backward compatibility with v2"
echo ""
echo "🧪 Test the deployment:"
echo "  curl -X POST https://sports-proxy.your-account.workers.dev/responses \\"
echo "    -d '{\"model\":\"gpt-4.1\",\"input\":\"Get Yankees stats\",\"sport\":\"baseball\"}'"
echo ""
echo "📊 Monitor performance:"
echo "  wrangler tail --pretty"
echo ""
echo "📋 Next steps:"
echo "  1. Add sport selector to web/iOS apps"  
echo "  2. Implement other sports (football, basketball, hockey)"
echo "  3. Add ESPN authentication for fantasy tools"