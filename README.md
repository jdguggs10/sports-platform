# Sports Platform v3

A modern, sport-scoped data platform built on Cloudflare Workers with OpenAI Responses API integration.

## Architecture

This platform implements a v3 architecture with sport-scoped tooling that exposes ≤3 meta-tools per request, improving LLM accuracy and token efficiency.

### Key Components

- **sports-proxy**: Main orchestrator worker with OpenAI Responses API integration
- **baseball-stats-mcp**: Baseball statistics meta-tool façade
- **baseball-fantasy-mcp**: Fantasy baseball data with ESPN authentication
- **baseball-news-mcp**: Baseball news aggregation with caching

### Architecture Principles

- **Sport-scoped tooling**: Users select a sport upfront, exposing only 2-3 tools
- **Meta-tool façades**: Each tool hides 5-8 concrete endpoints behind a single interface
- **Zero-latency communication**: Service bindings for worker-to-worker calls
- **Direct API integration**: No legacy dependencies, self-contained micro-servers

## Directory Structure

```
sports-platform/
├── workers/           # Cloudflare Workers
│   ├── sports-proxy/  # Main orchestrator
│   ├── baseball-stats-mcp/
│   ├── baseball-fantasy-mcp/
│   └── baseball-news-mcp/
└── docs/             # Architecture documentation
    ├── ARCHITECTURE.md
    ├── MLB Stats API.md
    └── Flexible sport selection tooling.rtf
```

## Development

Each worker in the `workers/` directory can be deployed independently using Wrangler.

### Service Bindings

The platform uses Cloudflare Service Bindings for zero-latency communication between workers. The main orchestrator routes requests to sport-specific micro-servers.

### v3 Features

- ≤3 tools exposed per request (vs 6-12 in v2)
- ~250 context tokens (vs ~900 in v2)
- Sport-scoped meta-tool architecture
- Direct MLB API integration
- Entity resolution for team/player names