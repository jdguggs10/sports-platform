````
# MLB Stats API via Cloudflare Native MCP & OpenAI Responses API

**Overview**  
This guide walks you through exposing MLB’s Stats API behind a Cloudflare Native MCP server so an OpenAI–powered AI Agent can fetch data on demand. The Agent uses OpenAI’s Responses API (function-calling/MCP) to query our Worker, which in turn relays structured JSON back to your web‐app and iOS‐app. No API keys for MLB’s endpoint—just open JSON over HTTPS.

---

## Table of Contents
1. [Prerequisites](#prerequisites)  
2. [High-Level Architecture](#high-level-architecture)  
3. [Cloudflare Worker Setup](#cloudflare-worker-setup)  
   4. [1. Initialize Wrangler Project](#1-initialize-wrangler-project)  
   5. [2. Worker Code: MLB Fetcher](#2-worker-code-mlb-fetcher)  
   6. [3. `wrangler.toml` Configuration](#3-wranglertoml-configuration)  
   7. [4. Deploy the Worker](#4-deploy-the-worker)  
8. [Registering the Worker as an MCP “Tool”](#registering-the-worker-as-an-mcp-tool)  
   9. [1. Define the Tool Schema](#1-define-the-tool-schema)  
   10. [2. Register with OpenAI Responses API](#2-register-with-openai-responses-api)  
11. [AI Agent Flow (OpenAI → Cloudflare → MLB API)](#ai-agent-flow-openai--cloudflare--mlb-api)  
12. [Frontend Integration (Web & iOS)](#frontend-integration-web--ios)  
   13. [1. Receiving AI Responses](#1-receiving-ai-responses)  
   14. [2. Example Web‐App Snippet](#2-example-web‐app-snippet)  
   15. [3. Example iOS‐App Snippet](#3-example-ios‐app-snippet)  
16. [Testing & Validation](#testing--validation)  
17. [Best Practices & Tips](#best-practices--tips)  
18. [Next Steps & Enhancements](#next-steps--enhancements)

---

## Prerequisites
- **Cloudflare Account**: You need a (free) Cloudflare account.  
- **Wrangler CLI**: Installed and authenticated with your Cloudflare account (`npm install -g wrangler`).  
- **OpenAI API Key**: For registering MCP Tools and running the Responses API.  
- **Node.js (≥14.x)** + NPM/Yarn: For local Worker dev.  
- **Basic JavaScript/TypeScript** familiarity.  
- **Web‐App / iOS‐App**: You already have a frontend that can receive JSON and render.  

> ⚠️ **Opinion**: Native Workers are the best low-latency way to serve as an MCP backend. If you try “self-hosting,” you’ll fight infra issues. No regrets using Cloudflare here.

---

## High-Level Architecture

```plaintext
[User (Web or iOS)] 
      ↑                 ↓
[Your Frontend] ←→ [AI Agent via OpenAI Responses API] ←→ [Cloudflare Worker (MLB MCP)]
                                                          ↓
                                               [MLB Stats API: statsapi.mlb.com]
````

1. **Frontend** calls your backend (or directly invokes OpenAI with user question).
    
2. **AI Agent** (GPT-4.1 or whatever) decides when to call the “mlb_stats_fetch” function.
    
3. **OpenAI Responses API** (with function-calling) invokes the registered MCP endpoint (your Worker).
    
4. **Cloudflare Worker** proxies the request to https://statsapi.mlb.com/api/v1/..., returns JSON.
    
5. **OpenAI** formats the JSON into an “assistant” response.
    
6. **Frontend** displays the structured output.
    

---

## **Cloudflare Worker Setup**

  

### **1. Initialize Wrangler Project**

1. In your terminal, choose a directory (e.g., mlb-mcp-worker):
    

```
mkdir mlb-mcp-worker
cd mlb-mcp-worker
```

1.   
    
2. Initialize a new Worker (JavaScript template):
    

```
wrangler init --site --compatibility-date 2025-06-06
```

2. - Accept defaults or rename if prompted.
        
    - You’ll see a wrangler.toml and src/index.js (or index.ts) scaffold.
        
    
3. Install helper packages (optional but recommended):
    

```
npm install node-fetch@2.6.7
```

3. > 💡 We use node-fetch (v2) for HTTP requests inside the Worker. Workers have a built‐in fetch, but explicit import clarifies for local dev.
    

---

### **2. Worker Code: MLB Fetcher**

  

Open src/index.js (or index.ts) and replace with the following:

```
/**
 * src/index.js
 * Cloudflare Worker: Exposes a single endpoint (/mlb) that takes a JSON payload
 * describing which MLB Stats API resource to fetch, then proxies the result.
 */

import fetch from "node-fetch";

/**
 * Allowed MLB Stats “sub‐endpoints”. Expand as needed.
 * Key = command name; Value = relative path under `/api/v1/`.
 */
const MLB_ENDPOINTS = {
  getTeamInfo: "teams",                 // e.g., /teams?season=2025
  getRoster: "teams/{teamId}/roster",    // e.g., /teams/147/roster
  getPlayerStats: "people/{playerId}/stats", // e.g., /people/660271/stats?stats=season&group=hitting
  getSchedule: "schedule",               // e.g., /schedule?sportId=1&date=2025-06-06
  getLiveGame: "game/{gamePk}/feed/live" // e.g., /game/717024/feed/live
  // …add more endpoints as needed
};

/** 
 * Utility: interpolate path params 
 * E.g., pathTemplate = "people/{playerId}/stats", params = { playerId: 660271 }
 * → returns "people/660271/stats"
 */
function fillPath(pathTemplate, params = {}) {
  let filled = pathTemplate;
  for (const [key, value] of Object.entries(params)) {
    filled = filled.replace(`{${key}}`, encodeURIComponent(value));
  }
  return filled;
}

/**
 * Handler: expects POST with JSON body:
 * {
 *   "command": "getPlayerStats",
 *   "params": { "playerId": "660271", "stats": "season", "group": "hitting", "season": "2025" }
 * }
 *
 * Responds with the raw JSON from MLB’s Stats API.
 */
export default {
  async fetch(request, env) {
    try {
      if (request.method !== "POST") {
        return new Response("Only POST allowed", { status: 405 });
      }

      const payload = await request.json();
      const { command, params } = payload;
      if (!MLB_ENDPOINTS[command]) {
        return new Response(
          JSON.stringify({ error: `Unknown command: ${command}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // 1. Build the sub-path (e.g., "people/660271/stats")
      const rawPath = fillPath(MLB_ENDPOINTS[command], params.pathParams || {});
      
      // 2. Separate query params (everything not in pathParams)
      const query = new URLSearchParams(params.queryParams || {}).toString();
      const url = `https://statsapi.mlb.com/api/v1/${rawPath}${query ? `?${query}` : ""}`;

      // 3. Fetch from MLB Stats API
      const mlbResp = await fetch(url);
      if (!mlbResp.ok) {
        return new Response(
          JSON.stringify({ error: `MLB API error ${mlbResp.status}` }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }

      const data = await mlbResp.json();
      return new Response(JSON.stringify({ result: data }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          // CORS headers (if needed)
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async options(request) {
    // Handle CORS preflight
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  },
};
```

> 💬 **Why we did it this way:**

- > **Single “/” Route**—the MCP system just has one URL.
    
- > **Command‐Based**: The AI Agent sends command + params.
    
- > **No MLB Auth**: MLB’s Stats API is open. No secret keys, no OAuth dance.
    

---

### **3.** 

### **wrangler.toml**

###  **Configuration**

  

Edit wrangler.toml to define the Worker’s name, compatibility, and environment. Example:

```
name = "mlb-stats-mcp"
main = "src/index.js"
compatibility_date = "2025-06-06"

# Optional: route configuration if you have a custom domain
# [env.production]
#   route = "https://api.yourdomain.com/mlb"
#   zone_id = "YOUR_ZONE_ID"

[build]
upload_format = "service-worker"
```

- **name**: The Worker’s unique name on Cloudflare.
    
- **compatibility_date**: Ensures compatibility with Workers runtime (use today’s date).
    
- **main**: Points to your index.js.
    
- **Routes (optional)**: If you own api.yourdomain.com, uncomment and set route + zone_id. Otherwise, Cloudflare will auto‐assign a subdomain like mlb-stats-mcp.your-subdomain.workers.dev.
    

---

### **4. Deploy the Worker**

1. **Login** to Cloudflare via Wrangler:
    

```
wrangler login
```

1. (A browser window opens. Authenticate.)
    
2. **Publish** to default (Workers.dev) domain:
    

```
wrangler publish
```

2. - After a successful deploy, you’ll see something like:
        
    

```
✨ Success: Published mlb-stats-mcp (timestamp: 2025-06-06T15:00:00Z)
ℹ️  Live at https://mlb-stats-mcp.your-subdomain.workers.dev
```

2.   
    
3. **Test** in Postman / cURL:
    

```
curl -X POST "https://mlb-stats-mcp.your-subdomain.workers.dev" \
     -H "Content-Type: application/json" \
     -d '{
           "command": "getTeamInfo",
           "params": {
             "queryParams": { "season": "2025", "sportId": "1" }
           }
         }'
```

3. - You should get a JSON response with { result: { teams: [...] } }.
        
    

---

## **Registering the Worker as an MCP “Tool”**

  

Now that our Worker is live, we need to tell OpenAI’s Responses API about it—i.e., define it as a “tool” so GPT can call it.

  

### **1. Define the Tool Schema**

  

Create a JSON schema for our “mlb_stats_fetch” function. Save it locally (e.g., mlb_tool_schema.json):

```
[
  {
    "name": "mlb_stats_fetch",
    "description": "Fetch data from the official MLB Stats API via Cloudflare Worker",
    "url": "https://mlb-stats-mcp.your-subdomain.workers.dev",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    "json_schema": {
      "type": "object",
      "properties": {
        "command": {
          "type": "string",
          "enum": [
            "getTeamInfo",
            "getRoster",
            "getPlayerStats",
            "getSchedule",
            "getLiveGame"
          ],
          "description": "Which MLB endpoint to call."
        },
        "params": {
          "type": "object",
          "properties": {
            "pathParams": {
              "type": "object",
              "description": "Path parameters (e.g., teamId, playerId, gamePk)."
            },
            "queryParams": {
              "type": "object",
              "description": "Query parameters (e.g., season, sportId, date, stats, group)."
            }
          },
          "required": []
        }
      },
      "required": ["command"]
    }
  }
]
```

> 📝 **Note**:

- > url must point exactly to your Worker’s endpoint.
    
- > json_schema tells the AI Agent how to structure the POST body.
    
- > The enum for command lists supported paths. Expand as you add new MLB endpoints.
    

---

### **2. Register with OpenAI Responses API**

  

Use your favorite HTTP client or CLI to register the tool. Here’s a curl example:

```
curl https://api.openai.com/v1/tools \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '[
        {
          "name": "mlb_stats_fetch",
          "description": "Fetch data from MLB Stats API",
          "url": "https://mlb-stats-mcp.your-subdomain.workers.dev",
          "method": "POST",
          "headers": {
            "Content-Type": "application/json"
          },
          "json_schema": {
            "type": "object",
            "properties": {
              "command": {
                "type": "string",
                "enum": [
                  "getTeamInfo",
                  "getRoster",
                  "getPlayerStats",
                  "getSchedule",
                  "getLiveGame"
                ],
                "description": "Which MLB endpoint to call."
              },
              "params": {
                "type": "object",
                "properties": {
                  "pathParams": {
                    "type": "object"
                  },
                  "queryParams": {
                    "type": "object"
                  }
                }
              }
            },
            "required": ["command"]
          }
        }
      ]'
```

- **Response** will include a JSON array of registered tools. Copy the tool_id for mlb_stats_fetch—you’ll need it when instantiating the AI Agent.
    

  

> 🚀 **Tip**: If you ever update your Worker URL or supported commands, re-run this registration so the Agent knows about changes.

---

## **AI Agent Flow (OpenAI → Cloudflare → MLB API)**

1. **User asks** (in natural language) “What’s Shohei Ohtani’s 2025 batting average?”
    
2. **Your Frontend** sends that prompt to the OpenAI Responses API, with tools=["mlb_stats_fetch"] and tool_schema loaded.
    
3. **GPT** processes the question, realizes it needs data:
    

```
{
  "action": {
    "tool": "mlb_stats_fetch",
    "arguments": {
      "command": "getPlayerStats",
      "params": {
        "pathParams": { "playerId": "660271" },
        "queryParams": { "stats": "season", "group": "hitting", "season": "2025" }
      }
    }
  }
}
```

3.   
    
4. **OpenAI** calls:
    

```
POST https://mlb-stats-mcp.your-subdomain.workers.dev
Content-Type: application/json

{
  "command": "getPlayerStats",
  "params": {
    "pathParams": { "playerId": "660271" },
    "queryParams": { "stats": "season", "group": "hitting", "season": "2025" }
  }
}
```

4.   
    
5. **Worker** returns:
    

```
{
  "result": {
    "stats": [
      {
        "splits": [
          {
            "stat": {
              "avg": ".305",
              "rbi": 45,
              "hr": 9,
              // …etc
            },
            "season": "2025",
            "group": "hitting"
          }
        ]
      }
    ]
  }
}
```

5.   
    
6. **GPT** formats a user‐friendly answer:
    
    > “In 2025, Shohei Ohtani is batting .305 with 9 home runs and 45 RBIs.”
    
7. **Frontend** displays that answer in your web‐app / iOS‐app chat interface.
    

---

## **Frontend Integration (Web & iOS)**

  

### **1. Receiving AI Responses**

  

Your frontend should:

- Send user prompt to your Node/Python backend or directly to OpenAI’s Responses API.
    
- Include mlb_stats_fetch in the functions array (with schema) when calling chat.completions.
    
- Monitor the response for “function_call” objects.
    
- If GPT returns structured JSON from mlb_stats_fetch, it’s already inside the assistant message—just render.
    

  

#### **Example OpenAI Request (Node.js)**

```
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function askGPT(question) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an MLB expert." },
      { role: "user", content: question }
    ],
    functions: [ /* insert mlb_tool_schema.json contents here */ ],
    function_call: "auto"
  });
  return response.choices[0].message;
}
```

- If message.function_call is present, extract arguments, send that to your Worker (or let OpenAI do it automatically if using native MCP feature).
    
- Finally, display message.content (GPT’s natural‐language summary).
    

---

### **2. Example Web‐App Snippet (React)**

```
import React, { useState } from "react";

function MLBChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  async function sendMessage() {
    const userMsg = { role: "user", content: input };
    setMessages([...messages, userMsg]);
    setInput("");

    // 1) Call your backend with OpenAI logic (see above)
    const assistantMsg = await fetch("/api/ask-gpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: input })
    }).then(r => r.json());

    // 2) Append the response
    setMessages((prev) => [...prev, { role: "assistant", content: assistantMsg }]);
  }

  return (
    <div>
      <div id="chat-window">
        {messages.map((m, i) => (
          <div key={i} className={m.role}>
            {m.content}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask about MLB stats..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default MLBChat;
```

> 🎯 **Tip**: Let your backend handle all OpenAI calls. Keep frontend “dumb” (just display and send user text).

---

### **3. Example iOS‐App Snippet (Swift + URLSession)**

```
import SwiftUI

struct ContentView: View {
    @State private var messages: [String] = []
    @State private var input: String = ""

    var body: some View {
        VStack {
            ScrollView {
                ForEach(messages, id: \.self) { msg in
                    Text(msg)
                        .padding()
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(8)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)
                }
            }

            HStack {
                TextField("Ask about MLB stats...", text: $input)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .frame(minHeight: 30)

                Button(action: {
                    sendMessage()
                }) {
                    Text("Send")
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(8)
            }
            .padding()
        }
    }

    func sendMessage() {
        let userMessage = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !userMessage.isEmpty else { return }
        messages.append("You: \(userMessage)")
        input = ""

        // 1) Construct request to your backend endpoint (e.g., /ask-gpt)
        guard let url = URL(string: "https://your-backend.example.com/ask-gpt") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = ["prompt": userMessage]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        // 2) Send
        URLSession.shared.dataTask(with: request) { data, response, error in
            guard
                let data = data,
                let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                let reply = json["assistant"] as? String
            else {
                return
            }

            DispatchQueue.main.async {
                messages.append("GPT: \(reply)")
            }
        }.resume()
    }
}
```

> 🔥 **Opinion**: Wrapping the entire GPT + Tool‐calling logic in your own backend makes iOS simpler (no direct OpenAI calls from the client, better security).

---

## **Testing & Validation**

1. **Manual cURL Tests**
    
    - **Team Info**
        
    

```
curl -X POST "https://mlb-stats-mcp.your-subdomain.workers.dev" \
     -H "Content-Type: application/json" \
     -d '{
           "command": "getTeamInfo",
           "params": { "queryParams": { "season": "2025", "sportId": "1" } }
         }'
```

1. -   
        
    - **Player Stats**
        
    

```
curl -X POST "https://mlb-stats-mcp.your-subdomain.workers.dev" \
     -H "Content-Type: application/json" \
     -d '{
           "command": "getPlayerStats",
           "params": {
             "pathParams": { "playerId": "660271" },
             "queryParams": { "stats": "season", "group": "hitting", "season": "2025" }
           }
         }'
```

1.   
    
    Confirm JSON shape, check for errors, handle unexpected status codes.
    
2. **End‐to‐End AI Test**
    
    - In Postman, simulate an OpenAI chat completion with the registered function.
        
    - Verify GPT issues the function call payload correctly.
        
    - Ensure Cloudflare Worker responds with valid MLB JSON.
        
    - Confirm GPT’s natural‐language summary matches data.
        
    
3. **Frontend Smoke Test**
    
    - Type “Who leads MLB in HR as of today?” in your Web or iOS chat UI.
        
    - Check logs for:
        
        - Frontend → Backend request
            
        - Backend → OpenAI (function schema)
            
        - GPT → Worker → MLB → Worker → GPT → Frontend
            
        
    - Ensure no errors, stable latencies (<500 ms ideally).
        
    

---

## **Best Practices & Tips**

- **Cache Popular Endpoints**
    
    - Some data (team rosters, standings) changes infrequently. Use Cloudflare’s Cache API or set appropriate Cache-Control headers inside the Worker to reduce redundant MLB hits.
        
    - Example:
        
    

```
// Inside fetch():
const cacheKey = new Request(url, request);
const cache = caches.default;
let response = await cache.match(cacheKey);
if (!response) {
  response = await fetch(url);
  response = new Response(await response.text(), response);
  response.headers.set("Cache-Control", "max-age=60"); // cache 1 minute
  event.waitUntil(cache.put(cacheKey, response.clone()));
}
return response;
```

-   
    
- **Error Handling in GPT**
    
    - Wrap function calls in a try-catch block on the GPT side.
        
    - If Worker returns { error: "..." }, have GPT return a “friendly” apology:
        
        > “Sorry, I hit a snag fetching that data—please try again in a moment.”
        
    
- **Rate‐Limit Awareness**
    
    - MLB Stats API doesn’t publish rate limits, but over-hitting is a recipe for IP bans. Throttle your AI‐driven queries (e.g., limit “getSchedule” requests to once every 10 seconds).
        
    - Use Cloudflare’s built-in rate limiting (optionally under “Traffic” → “Rate Limiting”).
        
    
- **Expand Commands Gradually**
    
    - Start with 3–5 endpoints (e.g., getTeamInfo, getPlayerStats, getSchedule).
        
    - Once stable, add fields like “getStandings” or “getInjuries.”
        
    - Update the json_schema enum and redeploy/ re-register.
        
    
- **Versioning**
    
    - If you anticipate breaking changes, maintain multiple Worker versions (e.g., mlb-stats-mcp-v1, v2).
        
    - Tag functions in OpenAI with version numbers so you can migrate AI Agents smoothly.
        
    

---

## **Next Steps & Enhancements**

1. **Authentication Layer (Optional)**
    
    - If you eventually want private data (e.g., user-specific fantasy leagues), wrap this Worker behind an Auth0 or JWT check.
        
    - Example: Check for a valid Authorization: Bearer <token> header, verify via your auth provider, then proxy.
        
    
2. **Add ML-Powered Summaries**
    
    - After retrieving raw MLB JSON, you can optionally run a secondary GPT call to produce a bullet‐point summary (e.g., “Ohtani: .305 AVG, 9 HR, 45 RBI this season”).
        
    - But beware: double GPT calls add latency and cost.
        
    
3. **Webhook/Push Notifications for Live Games**
    
    - The Worker can push live game updates (e.g., every 30 seconds, fetch /game/{gamePk}/feed/live) and send to your app via WebSockets.
        
    - Let GPT intervene only when a user asks—otherwise just stream raw boxscore to your front end.
        
    
4. **Analytics & Logging**
    
    - Integrate Cloudflare Logs (or Kinesis) to track which commands are most used.
        
    - Use this data to prioritize caching and possible upgrades.
        
    
5. **iOS Widget or Siri Shortcut**
    
    - Build a tiny widget that simply asks, “Hey GPT, what’s the score of the Yankees game?”
        
    - Use Siri Intents to send prompts directly to your AI Agent backend.
        
    

---

> ⚾ **Bottom Line**:

> You now have a battle-tested, zero-maintenance Cloudflare Native MCP server that can fetch **any** MLB Stats API resource on demand. GPT just calls mlb_stats_fetch with a command + params; your Worker proxies to statsapi.mlb.com, returns JSON; GPT turns it into human language; your Web/iOS apps show it. Welcome to the big leagues. 🎉