/**
 * Sports Proxy Worker - Main Entry Point
 * 
 * Cloudflare Worker implementing the OpenAI Responses API for sports-related queries
 * with enhanced memory management, layered prompts, and advanced caching.
 * 
 * Features:
 * - Official OpenAI Responses API with gpt-4.1-mini
 * - Enhanced prompt management with user memory
 * - Server-side state management with store option
 * - Built-in web search and analytics tools
 * - Advanced error handling and retries
 * - Sports-specific query optimization
 * - User memory persistence and context injection
 */

import { SportsResponsesAPI, SportsResponsesUtils, DEFAULT_MODEL } from './openai/responsesapi.js';
import { PromptManager } from './prompts/manager.js';
import { ToolRegistry } from './registry/toolRegistry.js';

/**
 * Main Worker Handler
 */
export default {
  async fetch(request, env) {
    try {
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-User-ID',
            'Access-Control-Max-Age': '86400',
          }
        });
      }

      // Initialize components
      const apiKey = env.OPENAI_API_KEY;
      if (!apiKey) {
        return jsonResponse({ error: 'OpenAI API key not configured' }, 500);
      }

      const sportsAPI = new SportsResponsesAPI(apiKey, {
        timeout: 30000,
        maxRetries: 3
      });

      const promptManager = new PromptManager(env);
      const toolRegistry = new ToolRegistry(env, null); // cacheManager not needed for direct KV access

      // Route handling
      const url = new URL(request.url);
      const path = url.pathname;

      switch (path) {
        case '/':
          return handleHealthCheck();
        
        case '/responses':
          return handleResponsesAPI(request, sportsAPI, promptManager, toolRegistry);
        
        default:
          return jsonResponse({ error: 'Endpoint not found' }, 404);
      }

    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      }, 500);
    }
  }
};

/**
 * Health check endpoint with memory management status
 */
function handleHealthCheck() {
  return jsonResponse({
    status: 'healthy',
    service: 'Sports Proxy Worker',
    version: '2.1.0',
    api: 'OpenAI Responses API',
    model: DEFAULT_MODEL,
    features: [
      'Enhanced Prompt Management',
      'User Memory Persistence',
      'Layered Instructions',
      'Server-side State Management',
      'Multi-sport Support',
      'Real-time Tools Integration'
    ],
    memory_management: {
      enabled: true,
      layers: ['general', 'sport-specific', 'user-memory'],
      cache_timeout: '5 minutes',
      user_memory_timeout: '30 minutes'
    },
    timestamp: new Date().toISOString()
  });
}









/**
 * Handle OpenAI Responses API endpoint
 * Implements the official OpenAI Responses API format
 */
async function handleResponsesAPI(request, sportsAPI, promptManager, toolRegistry) {
  try {
    const body = await request.json();
    const { 
      model = 'gpt-4.1-mini',
      input,
      instructions,
      tools,
      previous_response_id,
      stream = false,
      temperature,
      max_output_tokens,
      store = true,
      // Sports-specific context (these won't be passed to OpenAI)
      sport,
      userId,
      conversationType = 'general',
      memories
    } = body;

    if (!input) {
      return jsonResponse({ error: 'Input is required' }, 400);
    }

    // Build context for sports-specific optimization
    const context = {
      userId,
      sport: sport || 'general',
      conversationType,
      includeUserMemory: !!userId,
      sessionId: request.headers.get('x-session-id'),
    };

    // Generate enhanced instructions if not provided
    let finalInstructions = instructions;
    if (!instructions) {
      finalInstructions = await promptManager.generateInstructions(sport || 'general', context);
    }

    // Process memories if provided (sports-proxy specific feature)
    if (memories && Array.isArray(memories)) {
      for (const memory of memories) {
        if (memory.key && memory.value && userId) {
          await promptManager.updateUserMemory(userId, { [memory.key]: memory.value });
        }
      }
    }

    // Fetch MCP tools for the sport if no tools provided
    let finalTools = tools;
    if (!finalTools && sport && sport !== 'general') {
      try {
        finalTools = await toolRegistry.getToolsForSport(sport);
        console.log(`Fetched ${finalTools?.length || 0} tools for sport: ${sport}`);
      } catch (error) {
        console.error('Failed to fetch MCP tools:', error);
        finalTools = [];
      }
    }

    // Prepare options for the API call (only OpenAI-compatible parameters)
    const apiOptions = {
      model,
      instructions: finalInstructions,
      tools: finalTools,
      previousResponseId: previous_response_id,
      temperature,
      max_output_tokens,
      store
    };

    if (stream) {
      // For streaming, we need to return Server-Sent Events format
      return handleStreamingResponsesAPI(request, sportsAPI, promptManager, toolRegistry, body);
    } else {
      // Handle non-streaming response
      const response = await sportsAPI.createResponse(input, apiOptions);

      // Update user memory in background if userId provided
      if (userId) {
        const conversationData = {
          messages: [
            { role: 'user', content: typeof input === 'string' ? input : JSON.stringify(input) },
            { role: 'assistant', content: response.text }
          ]
        };
        
        promptManager.updateUserMemory(userId, conversationData).catch(err => {
          console.error('Background memory update failed:', err);
        });
      }

      // Return response in OpenAI Responses API format
      return jsonResponse({
        id: response.id,
        object: 'response',
        created_at: response.created_at,
        model: response.model,
        output: response.output,
        output_text: response.text, // Helper field for easy access
        usage: response.usage
      });
    }

  } catch (error) {
    console.error('Responses API error:', error);
    return jsonResponse({ 
      error: 'Responses API request failed',
      message: error.message,
      type: error.constructor.name
    }, 500);
  }
}

/**
 * Handle streaming Responses API requests
 */
async function handleStreamingResponsesAPI(request, sportsAPI, promptManager, toolRegistry, body) {
  const { 
    model = 'gpt-4.1-mini',
    input,
    instructions,
    tools,
    previous_response_id,
    sport,
    userId,
    conversationType = 'general'
  } = body;

  // Build context
  const context = {
    userId,
    sport: sport || 'general',
    conversationType,
    includeUserMemory: !!userId,
    sessionId: request.headers.get('x-session-id'),
  };

  // Generate instructions if not provided
  let finalInstructions = instructions;
  if (!instructions) {
    finalInstructions = await promptManager.generateInstructions(sport || 'general', context);
  }

  // Fetch MCP tools for the sport if no tools provided
  let finalTools = tools;
  if (!finalTools && sport && sport !== 'general') {
    try {
      finalTools = await toolRegistry.getToolsForSport(sport);
      console.log(`Fetched ${finalTools?.length || 0} tools for streaming sport: ${sport}`);
    } catch (error) {
      console.error('Failed to fetch MCP tools for streaming:', error);
      finalTools = [];
    }
  }

  const apiOptions = {
    model,
    instructions: finalInstructions,
    tools: finalTools,
    previousResponseId: previous_response_id
  };

  // Create a ReadableStream for Server-Sent Events
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Start the streaming response in the background
  (async () => {
    try {
      let collectedContent = '';
      let responseId = null;

      await sportsAPI.createStreamingResponse(input, apiOptions, async (event) => {
        if (event.type === 'response.created') {
          responseId = event.response.id;
          await writer.write(encoder.encode(`data: ${JSON.stringify({
            response_created: true,
            id: responseId
          })}\n\n`));
        } else if (event.type === 'response.output_text.delta') {
          const content = event.delta;
          collectedContent += content;
          await writer.write(encoder.encode(`data: ${JSON.stringify({
            text: content
          })}\n\n`));
        } else if (event.type === 'response.completed') {
          await writer.write(encoder.encode(`data: ${JSON.stringify({
            response_completed: true
          })}\n\n`));
        } else if (event.type === 'response.error') {
          await writer.write(encoder.encode(`data: ${JSON.stringify({
            error: event.error
          })}\n\n`));
        }
      });

      // Update user memory in background
      if (userId && collectedContent) {
        const conversationData = {
          messages: [
            { role: 'user', content: typeof input === 'string' ? input : JSON.stringify(input) },
            { role: 'assistant', content: collectedContent }
          ]
        };
        
        promptManager.updateUserMemory(userId, conversationData).catch(err => {
          console.error('Background memory update failed:', err);
        });
      }

      await writer.write(encoder.encode('data: [DONE]\n\n'));
    } catch (error) {
      await writer.write(encoder.encode(`data: ${JSON.stringify({
        error: error.message
      })}\n\n`));
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    }
  });
}

/**
 * Helper function to create JSON responses with CORS headers
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    }
  });
}

/**
 * Export for testing
 */
export {
  handleHealthCheck,
  handleResponsesAPI,
  handleStreamingResponsesAPI
};
