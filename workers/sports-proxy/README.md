# Sports Proxy Worker - OpenAI Responses API with Entity Resolution

A comprehensive Cloudflare Worker implementation using the official OpenAI Responses API with sport-specific entity resolution and intelligence orchestration.

## 🚀 Features

### Official SDK Implementation
- ✅ Uses `client.responses.create` from the official `openai` npm package
- ✅ Built-in retries and error handling with specific error subclasses
- ✅ Parameter validation and type safety
- ✅ Raw HTTP response access with `.withResponse()`

### State Management
- ✅ Server-side conversation state with `store: true`
- ✅ Automatic conversation continuity using `previous_response_id`
- ✅ ConversationManager class for stateful interactions
- ✅ No manual history tracking required

### Function Calling
- ✅ Simplified function calling with automatic execution
- ✅ Built-in function definition, execution, and result passing
- ✅ Error handling for function execution
- ✅ Support for multiple function calls in sequence

### Enhanced Features
- ✅ Streaming responses with Server-Sent Events (SSE)
- ✅ Sports-specific query optimization
- ✅ Built-in tools: web search, code interpreter, file search
- ✅ Reasoning capabilities with `gpt-4.1-mini`
- ✅ Enhanced error handling with OpenAI error types
- ✅ **4 Sport-Specific Entity Resolvers**
- ✅ **Intelligent naming discrepancy resolution**
- ✅ **Lightweight resolver LLM scripts**
- ✅ **Database-backed entity resolution with aliases**

## 📁 File Structure

```
src/
├── index.js                 # Main Cloudflare Worker entry point
├── openai/
│   └── responsesapi.js      # Complete Responses API implementation
├── prompts/
│   ├── index.js            # Unified prompt system exports
│   ├── manager.js          # Enhanced prompt management with memory
│   ├── general.js          # General sports assistant prompts
│   ├── baseball.js         # MLB-specific prompts and expertise
│   ├── hockey.js           # NHL-specific prompts and analytics
│   └── football.js         # NFL-specific prompts and strategy
├── registry/
│   └── toolRegistry.js     # Dynamic tool registration and routing
└── test-responses-api.js    # Comprehensive test suite

../sport-resolvers/
├── baseball-resolver-mcp/   # Baseball entity resolver
├── hockey-resolver-mcp/     # Hockey entity resolver
├── football-resolver-mcp/   # Football entity resolver (placeholder)
└── basketball-resolver-mcp/ # Basketball entity resolver (placeholder)
```

## 🎯 Entity Resolution Architecture

The system implements a sophisticated 4-sport entity resolution architecture:

### Sport-Specific Resolvers
Lightweight LLM scripts that resolve naming discrepancies:

- **Baseball Resolver**: MLB teams/players with comprehensive aliases
  - "Yankees" → New York Yankees (ID: 147)
  - "Judge" → Aaron Judge (ID: 592450)
  - Full database with 30 teams + star players

- **Hockey Resolver**: NHL teams/players with nickname mapping  
  - "Bruins" → Boston Bruins (ID: 6)
  - "McDavid" → Connor McDavid (ID: 8478402)
  - Placeholder structure with 32 teams

- **Football Resolver**: NFL teams/players (placeholder)
  - Ready for population with NFL data
  - 32 teams structure with sample players

- **Basketball Resolver**: NBA teams/players (placeholder)
  - Ready for population with NBA data
  - 30 teams structure with sample players

### Resolution Process
```javascript
// Entity resolution flow
1. LLM request: "Get Aaron Judge stats"
2. Tool call: resolve_baseball_player({name: "Aaron Judge"})
3. Resolver returns: {id: 592450, name: "Aaron Judge", team_id: 147}
4. Stats API call with resolved ID
5. Response to user with accurate data
```

## 🛠 Core Classes

### SportsResponsesAPI

The main API client implementing the OpenAI Responses API.

```javascript
import { SportsResponsesAPI } from './openai/responsesapi.js';

const api = new SportsResponsesAPI(apiKey, {
  timeout: 30000,
  maxRetries: 3
});

// Basic response
const response = await api.createResponse("What's the latest NBA news?");

// With tools
const response = await api.createResponse("Analyze player performance", {
  tools: [{ type: 'web_search' }, { type: 'code_interpreter' }]
});
```

### ConversationManager

Manages stateful conversations with automatic state tracking.

```javascript
const conversation = api.createConversation(
  "You are a fantasy sports expert",
  { temperature: 0.8 }
);

const response1 = await conversation.sendMessage("Help me with my draft");
const response2 = await conversation.sendMessage("What about trade strategies?");
```

## 🔧 API Endpoints

### Health Check
```
GET /
```
Returns service status and configuration.

### Basic Chat
```
POST /chat
Content-Type: application/json

{
  "message": "What are the latest NBA scores?",
  "instructions": "You are a sports expert",
  "tools": [{"type": "web_search"}],
  "options": {
    "temperature": 0.7,
    "max_completion_tokens": 500
  }
}
```

### Streaming Chat
```
POST /chat/stream
Content-Type: application/json

{
  "message": "Analyze the playoffs",
  "instructions": "You are a sports analyst",
  "tools": [{"type": "web_search"}, {"type": "code_interpreter"}]
}
```

Returns Server-Sent Events stream with real-time response generation.

### Sports Query Optimization
```
POST /sports/query
Content-Type: application/json

{
  "query": "Who are the top fantasy players this week?",
  "type": "fantasy",
  "options": {
    "reasoning": {"effort": "medium"}
  }
}
```

### Conversation Management
```
POST /conversation/start
{
  "message": "I need fantasy advice",
  "type": "fantasy"
}

POST /conversation/continue
{
  "message": "What about waiver pickups?",
  "conversation_id": "resp_abc123"
}
```

## 🏗 Key Improvements Over Chat Completions API

| Feature | Chat Completions | Responses API | Implementation |
|---------|------------------|---------------|----------------|
| **State Management** | Manual history tracking | Server-side with `store: true` | ✅ Implemented |
| **Response Format** | `choices[0].message.content` | `response.output_text` | ✅ Simplified access |
| **Tools** | Custom implementation | Built-in tools available | ✅ Web search, code interpreter |
| **Continuation** | Reconstruct full history | `previous_response_id` | ✅ Automatic state |
| **Streaming** | Basic delta events | Semantic event types | ✅ Rich event handling |
| **Error Handling** | Generic errors | Specific error subclasses | ✅ Enhanced error types |

## 🎯 Sports-Specific Features

### Entity Resolution Tools
Automatically resolves naming discrepancies for accurate data retrieval:

```javascript
// Baseball entity resolution
{
  "type": "function",
  "function": {
    "name": "resolve_baseball_team",
    "description": "Resolve team name to canonical MLB team information",
    "parameters": {
      "type": "object",
      "properties": {
        "name": {"type": "string", "description": "Team name, city, or abbreviation"}
      }
    }
  }
}

// Hockey entity resolution
{
  "type": "function", 
  "function": {
    "name": "resolve_hockey_player",
    "description": "Resolve player name to canonical NHL player information",
    "parameters": {
      "type": "object",
      "properties": {
        "name": {"type": "string", "description": "Player name or nickname"}
      }
    }
  }
}
```

### Tool Registry
Dynamic tool registration based on sport detection:

```javascript
// Automatic tool selection
const toolRegistry = new ToolRegistry(env);
const tools = await toolRegistry.getToolsForSport('baseball');
// Returns: [resolve_baseball_team, resolve_baseball_player, search_baseball_players]

const tools = await toolRegistry.getToolsForSport('hockey');
// Returns: [resolve_hockey_team, resolve_hockey_player, search_hockey_players]
```

### Resolution Confidence Scoring
Multi-level matching with confidence scores:

```javascript
// Entity resolution with confidence
{
  "resolved": true,
  "team": {
    "id": 147,
    "name": "New York Yankees",
    "match_type": "exact",    // exact, alias, fuzzy
    "confidence": 1.0         // 1.0, 0.9, 0.7
  }
}
```

## 🧠 Enhanced Memory Management System

### Layered Prompt Architecture

The enhanced prompt manager implements a sophisticated three-layer system:

1. **General Layer**: Base sports assistant capabilities and tool usage guidelines
2. **Sport-Specific Layer**: Specialized knowledge for baseball, hockey, football, or fantasy sports
3. **User Memory Layer**: Personalized context including preferences, history, and patterns

```javascript
// Example: Generate layered instructions
const instructions = await promptManager.getLayeredInstructions('baseball', {
  userId: 'user123',
  conversationType: 'fantasy',
  includeUserMemory: true
});
```

### User Memory Features

#### Automatic Memory Extraction
- **Team Preferences**: Automatically detects favorite teams from conversations
- **Player Mentions**: Tracks frequently discussed players
- **Query Patterns**: Learns user's common question types (fantasy, stats, scores)
- **Sports Interests**: Identifies which sports the user engages with most

#### Memory Persistence
- **KV Storage**: Fast access for active user sessions
- **D1 Database**: Long-term persistence and backup
- **Intelligent Caching**: 30-minute cache with automatic refresh
- **Size Management**: Automatically truncates to prevent token overflow

#### Privacy & Isolation
- **Per-User Isolation**: Complete separation of user memory data
- **Configurable Retention**: Set custom retention policies
- **Cache Control**: Selective clearing and management
- **Zero Data Retention**: Compatible with ZDR requirements

### Memory-Aware API Endpoints

#### Enhanced Chat with Memory
```javascript
POST /chat
{
  "message": "Should I start Player X this week?",
  "sport": "football",
  "userId": "user123",
  "conversationType": "fantasy"
}
```

#### Memory Management
```javascript
// Update user memory
POST /memory/update
{
  "userId": "user123",
  "facts": ["User prefers aggressive draft strategies"]
}

// Clear user memory cache
POST /memory/clear
{
  "userId": "user123",
  "clearType": "cache"
}

// Get cache statistics
GET /prompts/cache/stats
```

### Integration Patterns

#### Basic Integration
```javascript
import { PromptManager } from './prompts/manager.js';

const promptManager = new PromptManager(env);

// Generate instructions with user context
const instructions = await promptManager.generateInstructions('baseball', {
  userId,
  sport: 'baseball',
  conversationType: 'fantasy',
  includeUserMemory: true
});

// Use with Responses API
const response = await api.createResponse(message, { instructions });

// Update memory after conversation
await promptManager.updateUserMemory(userId, conversationData);
```

#### Advanced Integration with Streaming
```javascript
// Streaming with memory updates
const response = await api.createStreamingResponse(
  message,
  { instructions },
  async (event) => {
    if (event.type === 'response.completed') {
      // Update memory after streaming completes
      await promptManager.updateUserMemory(userId, conversationData);
    }
  }
);
```

### Entity Resolution Benefits

| Feature | Traditional | Entity Resolution |
|---------|-------------|-------------------|
| **Name Matching** | Exact only | ✅ Fuzzy + alias + exact |
| **Data Accuracy** | Hit or miss | ✅ Canonical ID resolution |
| **Multi-Sport Support** | Single sport | ✅ 4 dedicated resolvers |
| **Alias Support** | None | ✅ Comprehensive alias database |
| **Confidence Scoring** | None | ✅ Match quality indicators |
| **Scalability** | Monolithic | ✅ Lightweight per-sport workers |

### Configuration Options

```javascript
// Environment variables
{
  USER_MEMORY_KV: "User memory KV namespace",
  SPORTS_PROMPTS_BUCKET: "R2 bucket for custom prompts", 
  SPORTS_DB: "D1 database for persistent storage"
}

// Prompt manager options
{
  cacheTimeout: 5 * 60 * 1000,        // 5 minutes
  userMemoryTimeout: 30 * 60 * 1000,  // 30 minutes
  maxUserMemorySize: 5000              // Max characters
}
```

## 🚀 Deployment

Deploy to Cloudflare Workers:

```bash
# Set environment variables
wrangler secret put OPENAI_API_KEY

# Deploy
npm run deploy
```

## 📊 Performance Benefits

### Built-in Retries
- Automatic retry logic with exponential backoff
- No custom retry implementation needed
- Handles rate limits and temporary failures

### Server-Side State
- Reduced payload sizes (no message history)
- Faster response times
- Lower bandwidth usage

### Tool Integration
- Native web search ($25-50 per 1000 queries)
- Built-in code interpreter ($0.03 per session)
- File search capabilities ($2.50 per 1000 queries)

## ⚠ Migration Notes

**IMPORTANT**: This implementation uses the Responses API exclusively with sport-specific entity resolution. The previous monolithic approach has been replaced with lightweight resolver workers.

### Why Entity Resolution Architecture is Superior:
1. **Accurate Data Retrieval**: Resolve naming discrepancies before API calls
2. **Lightweight Workers**: Dedicated resolver per sport (≤3 tools exposed)
3. **Database-Backed Resolution**: Comprehensive alias and nickname support
4. **Confidence Scoring**: Quality indicators for fuzzy matches
5. **Scalable Design**: Add new sports without affecting existing resolvers
6. **Future-Proof**: Compatible with OpenAI Responses API specification

## 🔐 Environment Variables

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

## 📝 License

MIT License - See LICENSE file for details.

## 🏗️ Resolver Worker Architecture

### Baseball Resolver MCP
- **Database**: D1 SQLite with teams, players, aliases, stats
- **Data**: Full MLB roster with 30 teams + star players
- **Features**: Exact/alias/fuzzy matching, confidence scoring
- **Endpoints**: `/resolve/team`, `/resolve/player`, `/search/teams`

### Hockey Resolver MCP  
- **Database**: D1 SQLite with NHL structure
- **Data**: 32 NHL teams + sample players (placeholder)
- **Features**: Same resolution logic as baseball
- **Endpoints**: Same API pattern as baseball resolver

### Football & Basketball Resolvers
- **Status**: Placeholder structure ready for data population
- **Teams**: NFL (32 teams) and NBA (30 teams) complete
- **Players**: Sample star players for testing
- **Architecture**: Identical pattern to baseball/hockey

### Integration Pattern
```javascript
// Each resolver exposes OpenAI-compatible tools
GET /openai-tools.json
// Returns tool schemas for LLM integration

POST /resolve/team
{"name": "Yankees"}
// Returns resolved team with confidence score

POST /resolve/player  
{"name": "Judge", "team": "Yankees"}
// Returns resolved player with team context
```

---

This implementation represents a complete rewrite with sport-specific entity resolution, providing the most accurate and scalable approach to building AI-powered sports applications.
