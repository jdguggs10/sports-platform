Review this documentation for any request to code relating to the Responses API or the openai_client.py file or related files: https://platform.openai.com/docs/api-reference/responses

  
  

# OpenAI Responses API: Complete Implementation Guide

  

## Table of Contents

1. @Overview

2. @Key Features

3. @Getting Started

4. @Core Concepts

5. @Implementation Examples

6. @Built-in Tools

7. @Function Calling

8. @Streaming Responses

9. @State Management

10. @Error Handling

11. @Best Practices

12. @Migration from Chat Completions

13. @Rate Limits and Pricing

14. @Troubleshooting

  

## Overview

  

The **OpenAI Responses API** is OpenAI's newest and most advanced API interface, released in March 2025. It combines the strengths of the Chat Completions and Assistants APIs into a single, streamlined interface designed specifically for building AI agents and complex applications.

  

### What Makes It Different

- **Unified Interface**: Combines text generation, image analysis, function calling, and built-in tools

- **Server-Side State Management**: Optional conversation state storage on OpenAI's servers

- **Built-in Tools**: Native web search, file search, and computer use capabilities

- **Event-Driven Architecture**: Predictable streaming with semantic events

- **Agent-Focused**: Designed specifically for building AI agents and assistants

  

### When to Use the Responses API

✅ **ALWAYS USE Responses API for ALL projects:**

- Built-in tools (web search, file search, computer use)

- Server-side conversation state management

- Complex multi-turn interactions with tools

- AI agents that can perform actions

- Image generation within conversations

- Advanced reasoning capabilities with state persistence

- Simple text generation (use Responses API even for basic tasks)

- All conversation types, regardless of complexity

  

❌ **NEVER USE Chat Completions API:**

- **DEPRECATED FOR ALL NEW PROJECTS**

- Chat Completions API is outdated and should not be used

- All functionality can be better achieved with Responses API

- Responses API provides superior architecture and capabilities

- **NO EXCEPTIONS: Use Responses API for everything**

  

## Key Features

  

### 1. Built-in Tools

- **Web Search**: Real-time web search capabilities ($25-50 per 1000 queries)

- **File Search**: Search through uploaded documents ($2.50 per 1000 queries)

- **Computer Use**: Interface interaction capabilities (preview)

- **Code Execution**: Built-in code interpreter ($0.03 per session)

- **Image Generation**: Native image creation with "gpt-image-1" model

  

### 2. State Management

- **Server-Side Storage**: OpenAI manages conversation history

- **Previous Response ID**: Continue conversations seamlessly

- **Reasoning Persistence**: Reasoning tokens persist across turns

- **Zero Data Retention**: Available for compliance requirements

  

### 3. Enhanced Input/Output

- **Flexible Input**: Accepts strings or arrays (text + images)

- **Typed Responses**: Structured response objects with unique IDs

- **Event Streaming**: Granular events for better UX

- **Multi-modal Support**: Text, images, and structured data

  

## Getting Started

  

### Authentication

  

The Responses API uses the same authentication as other OpenAI APIs:

  

```python

from openai import OpenAI

import os

  

# Standard API Key Authentication

client = OpenAI(

api_key=os.getenv("OPENAI_API_KEY")

)

  

# For Azure OpenAI

from openai import AzureOpenAI

from azure.identity import DefaultAzureCredential, get_bearer_token_provider

  

token_provider = get_bearer_token_provider(

DefaultAzureCredential(),

"https://cognitiveservices.azure.com/.default"

)

  

client = AzureOpenAI(

base_url="https://YOUR-RESOURCE-NAME.openai.azure.com/openai/v1/",

azure_ad_token_provider=token_provider,

api_version="preview"

)

```

  

### Basic Setup Requirements

  

1. **OpenAI Python Library**: Upgrade to latest version

```bash

pip install openai --upgrade

```

  

2. **API Access**: Responses API is available in preview

3. **Model Support**: Use gpt-4.1 for all implementations

  

## Core Concepts

  

### Input Structure

The Responses API accepts flexible input formats:

  

```python

# String input (simple)

response = client.responses.create(

model="gpt-4.1",

input="What is the weather like today?"

)

  

# Array input (structured conversations)

response = client.responses.create(

model="gpt-4.1",

input=[

{"role": "user", "content": "Analyze this image"},

{"role": "user", "content": [

{"type": "text", "text": "What do you see?"},

{"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}

]}

]

)

```

  

### Response Structure

Responses return structured objects instead of choices arrays:

  

```python

# Response structure

{

"id": "resp_unique_id",

"created_at": 1740465465.0,

"model": "gpt-4.1",

"object": "response",

"output": [

{

"id": "msg_unique_id",

"content": [

{

"text": "Generated response text",

"type": "output_text"

}

],

"role": "assistant",

"type": "message"

}

],

"usage": {

"input_tokens": 20,

"output_tokens": 50,

"total_tokens": 70

}

}

  

# Access response text easily

print(response.output_text) # Helper method

```

  

## Implementation Examples

  

### Basic Text Generation

  

```python

from openai import OpenAI

client = OpenAI()

  

def simple_chat(message):

response = client.responses.create(

model="gpt-4.1",

input=message,

temperature=0.7

)

return response.output_text

  

# Usage

result = simple_chat("Explain quantum computing in simple terms")

print(result)

```

  

### Multi-turn Conversation with State Management

  

```python

def stateful_conversation():

# Start conversation

response1 = client.responses.create(

model="gpt-4.1",

input="Hi, I'm planning a trip to Japan",

instructions="You are a helpful travel assistant"

)

print("Assistant:", response1.output_text)

# Continue conversation using previous_response_id

response2 = client.responses.create(

model="gpt-4.1",

input="What's the best time to visit Tokyo?",

previous_response_id=response1.id # Maintains conversation state

)

print("Assistant:", response2.output_text)

return response2.id # Save for next turn

  

conversation_id = stateful_conversation()

```

  

### Image Analysis with Text

  

```python

def analyze_image_with_context(image_path, question):

# Read and encode image

import base64

with open(image_path, "rb") as image_file:

encoded_image = base64.b64encode(image_file.read()).decode('utf-8')

response = client.responses.create(

model="gpt-4.1",

input=[

{

"role": "user",

"content": [

{"type": "text", "text": question},

{

"type": "image_url",

"image_url": {"url": f"data:image/jpeg;base64,{encoded_image}"}

}

]

}

]

)

return response.output_text

  

# Usage

result = analyze_image_with_context("screenshot.png", "What's happening in this image?")

```

  

## Built-in Tools

  

### Web Search Tool

  

```python

def search_web(query):

response = client.responses.create(

model="gpt-4.1",

input=f"Search for recent news about: {query}",

tools=[

{"type": "web_search"}

]

)

return response.output_text

  

# Usage

news = search_web("artificial intelligence breakthroughs 2025")

print(news)

```

  

### File Search Tool

  

```python

def search_documents(query, file_ids):

response = client.responses.create(

model="gpt-4.1",

input=f"Find information about: {query}",

tools=[

{

"type": "file_search",

"vector_store_ids": file_ids

}

]

)

return response.output_text

  

# First upload files to OpenAI

file = client.files.create(

file=open("document.pdf", "rb"),

purpose="assistants"

)

  

# Create vector store

vector_store = client.vector_stores.create(

file_ids=[file.id]

)

  

# Search documents

result = search_documents("contract terms", [vector_store.id])

```

  

### Computer Use Tool (Preview)

  

```python

def computer_interaction(task):

response = client.responses.create(

model="computer-use-preview",

input=f"Please help me: {task}",

tools=[

{"type": "computer_use"}

]

)

return response.output_text

  

# Usage (when available)

result = computer_interaction("Take a screenshot of the current browser window")

```

  

### Image Generation Tool

  

```python

def generate_image(prompt):

response = client.responses.create(

model="gpt-image-1", # Dedicated image generation model

input=f"Create an image: {prompt}",

tools=[

{"type": "image_generation"}

]

)

return response.output_text # Contains image data or URL

  

# Usage

image_result = generate_image("A serene mountain landscape at sunset")

```

  

### Code Interpreter Tool

  

```python

def execute_code(code_prompt):

response = client.responses.create(

model="gpt-4.1",

input=code_prompt,

tools=[

{"type": "code_interpreter"}

]

)

return response.output_text

  

# Usage

result = execute_code("Calculate the fibonacci sequence up to 100 and plot it")

```

  

## Function Calling

  

### Defining Custom Functions

  

```python

def get_weather(location):

"""Get weather information for a location"""

# Simulate weather API call

return f"Weather in {location}: 72°F, sunny"

  

def get_stock_price(symbol):

"""Get current stock price"""

# Simulate stock API call

return f"Stock {symbol}: $150.25 (+2.3%)"

  

# Define function schemas

tools = [

{

"type": "function",

"name": "get_weather",

"description": "Get weather information for a specific location",

"parameters": {

"type": "object",

"strict": True,

"properties": {

"location": {

"type": "string",

"description": "The city and state/country"

}

},

"required": ["location"],

"additionalProperties": False

}

},

{

"type": "function",

"name": "get_stock_price",

"description": "Get current stock price for a symbol",

"parameters": {

"type": "object",

"strict": True,

"properties": {

"symbol": {

"type": "string",

"description": "Stock symbol (e.g., AAPL, GOOGL)"

}

},

"required": ["symbol"],

"additionalProperties": False

}

}

]

```

  

### Implementing Function Calling

  

```python

def handle_function_calls(user_message, tools):

# Initial request with tools

response = client.responses.create(

model="gpt-4.1",

input=user_message,

tools=tools

)

# Check if functions were called

function_results = []

for output in response.output:

if output.type == "function_call":

function_name = output.name

arguments = output.arguments

# Execute the function

if function_name == "get_weather":

result = get_weather(arguments["location"])

elif function_name == "get_stock_price":

result = get_stock_price(arguments["symbol"])

else:

result = "Function not found"

function_results.append({

"call_id": output.id,

"name": function_name,

"result": result

})

# If functions were called, send results back

if function_results:

final_response = client.responses.create(

model="gpt-4.1",

input=function_results,

previous_response_id=response.id

)

return final_response.output_text

return response.output_text

  

# Usage

result = handle_function_calls(

"What's the weather in San Francisco and the stock price of Apple?",

tools

)

```

  

## Streaming Responses

  

### Basic Streaming

  

```python

def stream_response(message):

stream = client.responses.create(

model="gpt-4.1",

input=message,

stream=True

)

print("Assistant: ", end="", flush=True)

for event in stream:

if event.type == "response.output_text.delta":

print(event.delta, end="", flush=True)

print() # New line after streaming

  

# Usage

stream_response("Tell me a short story about AI")

```

  

### Advanced Streaming with Event Handling

  

```python

def advanced_streaming(message):

stream = client.responses.create(

model="gpt-4.1",

input=message,

stream=True,

tools=[{"type": "web_search"}]

)

for event in stream:

if event.type == "response.created":

print("🚀 Response started")

elif event.type == "response.in_progress":

print("⏳ Generating response...")

elif event.type == "response.output_text.delta":

print(event.delta, end="", flush=True)

elif event.type == "web_search_call":

print("\n🔍 Searching the web...")

elif event.type == "response.completed":

print("\n✅ Response completed")

elif event.type == "response.error":

print(f"\n❌ Error: {event.error}")

  

# Usage

advanced_streaming("What are the latest AI developments this week?")

```

  

## State Management

  

### Conversation Persistence

  

```python

class ConversationManager:

def __init__(self, instructions=None):

self.last_response_id = None

self.instructions = instructions

def send_message(self, message):

kwargs = {

"model": "gpt-4.1",

"input": message,

}

# Add instructions only for first message

if self.last_response_id is None and self.instructions:

kwargs["instructions"] = self.instructions

# Continue conversation if not first message

if self.last_response_id:

kwargs["previous_response_id"] = self.last_response_id

response = client.responses.create(**kwargs)

self.last_response_id = response.id

return response.output_text

def reset_conversation(self):

self.last_response_id = None

  

# Usage

chat = ConversationManager("You are a helpful coding assistant")

  

print(chat.send_message("How do I implement a binary search in Python?"))

print(chat.send_message("Can you show me an example with error handling?"))

print(chat.send_message("What's the time complexity?"))

```

  

### Zero Data Retention (ZDR) Support

  

```python

def zdr_conversation(message, encrypted_reasoning=None):

"""For organizations with Zero Data Retention requirements"""

kwargs = {

"model": "gpt-4.1",

"input": message,

"store": False, # Automatically enforced for ZDR accounts

}

# Include encrypted reasoning from previous turns if available

if encrypted_reasoning:

kwargs["include"] = ["reasoning.encrypted_content"]

kwargs["reasoning"] = {"encrypted_content": encrypted_reasoning}

response = client.responses.create(**kwargs)

# Extract encrypted reasoning for next turn

next_encrypted_reasoning = getattr(response, 'reasoning_encrypted', None)

return response.output_text, next_encrypted_reasoning

```

  

## Error Handling

  

### Comprehensive Error Handling

  

```python

import openai

from openai import OpenAI

import time

  

def robust_api_call(message, max_retries=3):

client = OpenAI()

for attempt in range(max_retries):

try:

response = client.responses.create(

model="gpt-4.1",

input=message,

timeout=30 # 30 second timeout

)

return response.output_text

except openai.BadRequestError as e:

print(f"Bad request error: {e}")

print("Check your input format and parameters")

break # Don't retry bad requests

except openai.AuthenticationError as e:

print(f"Authentication error: {e}")

print("Check your API key")

break # Don't retry auth errors

except openai.PermissionDeniedError as e:

print(f"Permission denied: {e}")

print("Check your account permissions")

break

except openai.NotFoundError as e:

print(f"Resource not found: {e}")

break

except openai.RateLimitError as e:

print(f"Rate limit exceeded: {e}")

if attempt < max_retries - 1:

wait_time = 2 ** attempt # Exponential backoff

print(f"Waiting {wait_time} seconds before retry...")

time.sleep(wait_time)

else:

print("Max retries exceeded")

break

except openai.InternalServerError as e:

print(f"Server error: {e}")

if attempt < max_retries - 1:

wait_time = 2 ** attempt

print(f"Server error, retrying in {wait_time} seconds...")

time.sleep(wait_time)

else:

print("Max retries exceeded")

break

except Exception as e:

print(f"Unexpected error: {e}")

break

return None

  

# Usage

result = robust_api_call("What is machine learning?")

if result:

print(result)

else:

print("Failed to get response after retries")

```

  

### Streaming Error Handling

  

```python

def safe_streaming(message):

try:

stream = client.responses.create(

model="gpt-4.1",

input=message,

stream=True

)

collected_content = ""

for event in stream:

if event.type == "response.output_text.delta":

content = event.delta

print(content, end="", flush=True)

collected_content += content

elif event.type == "response.error":

print(f"\nError during streaming: {event.error}")

return None

print() # New line

return collected_content

except Exception as e:

print(f"Streaming failed: {e}")

return None

```

  

## Best Practices

  

### 1. Efficient Token Usage

  

```python

def optimize_tokens(message):

response = client.responses.create(

model="gpt-4.1", # Use gpt-4.1 for all tasks

input=message,

max_completion_tokens=500, # Limit response length

temperature=0.3, # Lower temperature for focused responses

)

return response.output_text

```

  

### 2. Proper State Management

  

```python

# ✅ Good: Use previous_response_id for state management

def continue_conversation(message, last_response_id):

return client.responses.create(

model="gpt-4.1",

input=message,

previous_response_id=last_response_id

)

  

# ❌ Avoid: Don't manually reconstruct conversation history

def bad_conversation(message, history):

# This defeats the purpose of the Responses API

full_history = history + [{"role": "user", "content": message}]

return client.responses.create(

model="gpt-4.1",

input=full_history

)

```

  

### 3. Tool Usage Optimization

  

```python

def smart_tool_usage(query):

# Only include tools that might be needed

needs_web_search = any(word in query.lower() for word in

["latest", "recent", "current", "news", "today"])

tools = []

if needs_web_search:

tools.append({"type": "web_search"})

response = client.responses.create(

model="gpt-4.1",

input=query,

tools=tools if tools else None

)

return response.output_text

```

  

### 4. Reasoning Token Management

  

```python

def efficient_reasoning(complex_query, previous_reasoning_items=None):

kwargs = {

"model": "gpt-4.1", # gpt-4.1 supports reasoning

"input": complex_query,

"reasoning": {"effort": "medium"} # Adjust based on complexity

}

# Include previous reasoning for multi-turn complex tasks

if previous_reasoning_items:

kwargs["include"] = ["reasoning.encrypted_content"]

response = client.responses.create(**kwargs)

# Save reasoning tokens for future use

reasoning_usage = response.usage.output_tokens_details.reasoning_tokens

print(f"Reasoning tokens used: {reasoning_usage}")

return response.output_text

```

  

### 5. Background Mode for Long Tasks

  

```python

def background_task(complex_request):

# Start background task

response = client.responses.create(

model="gpt-4.1", # Use gpt-4.1 for complex tasks

input=complex_request,

background=True # Run asynchronously

)

response_id = response.id

print(f"Started background task: {response_id}")

# Poll for completion

import time

while True:

status_response = client.responses.retrieve(response_id)

if status_response.status == "completed":

return status_response.output_text

elif status_response.status == "failed":

print(f"Task failed: {status_response.error}")

return None

else:

print("Task still running...")

time.sleep(10) # Wait 10 seconds before checking again

```

  

## Migration from Chat Completions

  

### ⚠️ IMPORTANT: NEVER USE CHAT COMPLETIONS API

  

**The Chat Completions API is deprecated for all new projects.** Even though OpenAI continues to support it, you should NEVER use it for any of your projects. The Responses API provides superior architecture, better capabilities, and represents the future of OpenAI's platform.

  

### Why Responses API is Always Better

  

| Aspect | Chat Completions API | Responses API |

|--------|---------------------|---------------|

| **State Management** | Manual (send full history) | Automatic (server-side) ✅ |

| **Response Format** | `choices[0].message.content` | `response.output_text` ✅ |

| **Tools** | Custom implementation required | Built-in tools available ✅ |

| **Input Format** | `messages` array | `input` (string or array) ✅ |

| **Continuation** | Reconstruct history | `previous_response_id` ✅ |

| **Streaming Events** | Basic delta events | Semantic event types ✅ |

| **Architecture** | Outdated | Modern, agent-focused ✅ |

  

### Migration Example

  

**Before (Chat Completions - NEVER USE):**

```python

# Chat Completions approach - DEPRECATED AND SHOULD NEVER BE USED

messages = [

{"role": "system", "content": "You are a helpful assistant"},

{"role": "user", "content": "What's the weather like?"}

]

  

response = client.chat.completions.create(

model="gpt-4.1",

messages=messages

)

  

reply = response.choices[0].message.content

messages.append({"role": "assistant", "content": reply})

  

# Continue conversation

messages.append({"role": "user", "content": "What about tomorrow?"})

response = client.chat.completions.create(

model="gpt-4.1",

messages=messages

)

```

  

**After (Responses API - ALWAYS USE):**

```python

# Responses API approach - THE ONLY CORRECT WAY

response1 = client.responses.create(

model="gpt-4.1",

instructions="You are a helpful assistant",

input="What's the weather like?",

tools=[{"type": "web_search"}] # Built-in tool

)

  

reply1 = response1.output_text

  

# Continue conversation - much simpler!

response2 = client.responses.create(

model="gpt-4.1",

input="What about tomorrow?",

previous_response_id=response1.id # Automatic state management

)

```

  

### Migration Checklist

  

**🚨 CRITICAL: Remove ALL Chat Completions API usage**

  

- [ ] **NEVER use `chat.completions.create()` - Use `responses.create()` ONLY**

- [ ] Update OpenAI library to latest version

- [ ] Replace ALL instances of `chat.completions.create()` with `responses.create()`

- [ ] Change `messages` parameter to `input`

- [ ] Update response parsing from `choices[0].message.content` to `output_text`

- [ ] Implement `previous_response_id` for multi-turn conversations

- [ ] Replace custom tool implementations with built-in tools where possible

- [ ] Update streaming event handling for new event types

- [ ] Use `reasoning.effort` parameter with gpt-4.1

- [ ] **Ensure NO Chat Completions API calls remain in codebase**

  

## Rate Limits and Pricing

  

### Rate Limits

The Responses API follows similar rate limiting to Chat Completions:

- **RPM (Requests Per Minute)**: Varies by tier and model

- **TPM (Tokens Per Minute)**: Varies by tier and model

- **Usage Tiers**: Higher usage = higher limits

  

### Pricing Structure

  

**Models:**

- **gpt-4.1**: Use for ALL projects - optimal performance and capability balance

- **Reasoning Capabilities**: Enhanced reasoning with `reasoning.effort` parameter

- **Multi-modal Support**: Text, images, and structured outputs

  

**Built-in Tools:**

- **Web Search**: $25-50 per 1000 queries (context-dependent)

- **File Search**: $2.50 per 1000 queries + $0.10/GB/day storage (first GB free)

- **Computer Use**: Preview pricing TBD

- **Code Interpreter**: $0.03 per session

- **Image Generation**: Priced per generation

  

**Reasoning Models:**

- **Cached Input Tokens**: 75% cheaper than uncached (for prompts >1024 tokens)

- **Reasoning Tokens**: Separate pricing tier

  

### Rate Limit Best Practices

  

```python

import time

import random

from openai import RateLimitError

  

def rate_limit_aware_request(message, max_retries=5):

for attempt in range(max_retries):

try:

response = client.responses.create(

model="gpt-4.1",

input=message,

max_completion_tokens=100 # Limit tokens to avoid overestimation

)

return response.output_text

except RateLimitError as e:

if attempt == max_retries - 1:

raise e

# Exponential backoff

wait_time = (2 ** attempt) + random.uniform(0, 1)

print(f"Rate limited. Waiting {wait_time:.2f} seconds...")

time.sleep(wait_time)

```

  

## Troubleshooting

  

### Common Issues and Solutions

  

**1. Response ID not found**

```python

# Problem: Using invalid previous_response_id

# Solution: Check if response ID exists and is recent

try:

response = client.responses.create(

model="gpt-4.1",

input="Continue our conversation",

previous_response_id="invalid_id"

)

except openai.NotFoundError:

print("Previous response not found. Starting new conversation.")

response = client.responses.create(

model="gpt-4.1",

input="Continue our conversation"

)

```

  

**2. Tool execution failures**

```python

def handle_tool_errors(message):

try:

response = client.responses.create(

model="gpt-4.1",

input=message,

tools=[{"type": "web_search"}]

)

return response.output_text

except Exception as e:

# Fallback without tools

print(f"Tool execution failed: {e}")

response = client.responses.create(

model="gpt-4.1",

input=f"{message} (Note: Unable to search web, providing based on training data)"

)

return response.output_text

```

  

**3. Streaming interruptions**

```python

def robust_streaming(message):

try:

stream = client.responses.create(

model="gpt-4.1",

input=message,

stream=True

)

content = ""

last_event_time = time.time()

for event in stream:

current_time = time.time()

# Check for stalled stream

if current_time - last_event_time > 30: # 30 second timeout

print("\nStream appears stalled, breaking...")

break

if event.type == "response.output_text.delta":

content += event.delta

print(event.delta, end="", flush=True)

last_event_time = current_time

return content

except Exception as e:

print(f"\nStreaming failed: {e}")

# Fallback to non-streaming

response = client.responses.create(

model="gpt-4.1",

input=message,

stream=False

)

return response.output_text

```

  

### Performance Optimization

  

**Monitor Token Usage:**

```python

def monitor_usage(message):

response = client.responses.create(

model="gpt-4.1",

input=message

)

usage = response.usage

print(f"Input tokens: {usage.input_tokens}")

print(f"Output tokens: {usage.output_tokens}")

print(f"Total tokens: {usage.total_tokens}")

if hasattr(usage, 'output_tokens_details'):

reasoning_tokens = usage.output_tokens_details.reasoning_tokens

print(f"Reasoning tokens: {reasoning_tokens}")

return response.output_text

```

  

**Cache Optimization:**

```python

def cache_friendly_request(base_prompt, variable_part):

# Structure requests to maximize cache hits

# Keep stable parts at the beginning

full_prompt = f"{base_prompt}\n\nSpecific request: {variable_part}"

response = client.responses.create(

model="gpt-4.1",

input=full_prompt

)

return response.output_text

```

  

## Summary

  

The OpenAI Responses API represents a significant evolution in AI application development, offering:

  

- **Simplified Development**: Built-in tools reduce custom implementation needs

- **Better State Management**: Server-side conversation handling

- **Enhanced Capabilities**: Multi-modal inputs, reasoning persistence, agent-focused features

- **Future-Proof**: Primary platform for new OpenAI features and models

  

## 🚨 CRITICAL: NEVER USE CHAT COMPLETIONS API

  

**For ALL projects, you must ALWAYS use the Responses API with gpt-4.1.** The Chat Completions API is deprecated and should never be used, even for simple tasks. The Responses API provides superior architecture and capabilities for every use case.

  

**Key Rules:**

- ✅ **ALWAYS use `client.responses.create()`**

- ✅ **ALWAYS use `model="gpt-4.1"`**

- ❌ **NEVER use `client.chat.completions.create()`**

- ❌ **NEVER use Chat Completions API for any reason**

  

The Responses API is designed to make complex AI interactions simpler while providing the flexibility needed for sophisticated applications. By following the patterns and best practices outlined in this guide, you can build robust, efficient, and maintainable AI-powered applications using the only correct approach: the Responses API with gpt-4.1.