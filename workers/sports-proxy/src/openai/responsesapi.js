/**
 * OpenAI Responses API Implementation for Sports Proxy
 * 
 * This module implements the official OpenAI Responses API with:
 * - Official SDK with built-in retries and error handling
 * - State management with store option
 * - Function calling support
 * - Streaming capabilities
 * - Enhanced error handling
 * 
 * Based on OpenAI Responses API Guide (March 2025)
 */

import OpenAI from 'openai';
import { DEFAULT_MODEL, API_CONFIG } from '../config.js';

// Re-export DEFAULT_MODEL for backward compatibility
export { DEFAULT_MODEL };

/**
 * Sports Proxy Responses API Client
 * Implements the latest OpenAI Responses API with sports-specific optimizations
 */
export class SportsResponsesAPI {
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey,
      timeout: options.timeout || 30000,
      maxRetries: options.maxRetries || 3,
      ...options
    });

    // Default configuration following best practices
    this.defaultConfig = {
      ...API_CONFIG
    };

    // Tools registry for sports-specific functionality
    this.availableTools = {
      web_search: { type: 'web_search' },
      file_search: { type: 'file_search' },
      code_interpreter: { type: 'code_interpreter' },
      // Custom sports tools will be defined separately
    };
  }

  /**
   * Create a response using the Responses API
   * @param {string|Array} input - Message input (string or structured array)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response object
   */
  async createResponse(input, options = {}) {
    try {
      const requestConfig = {
        ...this.defaultConfig,
        ...options,
        input,
      };

      // Handle previous response ID for conversation continuity
      if (options.previousResponseId) {
        requestConfig.previous_response_id = options.previousResponseId;
      }

      // Handle instructions (only for first message in conversation)
      if (options.instructions && !options.previousResponseId) {
        requestConfig.instructions = options.instructions;
      }

      // Add tools if specified
      if (options.tools) {
        requestConfig.tools = this._processTools(options.tools);
      }

      // Handle reasoning effort for complex queries
      if (options.reasoning) {
        requestConfig.reasoning = options.reasoning;
      }

      const response = await this.client.responses.create(requestConfig);
      
      return this._processResponse(response);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Create a streaming response
   * @param {string|Array} input - Message input
   * @param {Object} options - Additional options
   * @param {Function} onEvent - Event handler for streaming events
   * @returns {Promise<string>} Complete response text
   */
  async createStreamingResponse(input, options = {}, onEvent = null) {
    try {
      const requestConfig = {
        ...this.defaultConfig,
        ...options,
        input,
        stream: true,
      };

      // Handle previous response ID for conversation continuity
      if (options.previousResponseId) {
        requestConfig.previous_response_id = options.previousResponseId;
      }

      // Handle instructions
      if (options.instructions && !options.previousResponseId) {
        requestConfig.instructions = options.instructions;
      }

      // Add tools if specified
      if (options.tools) {
        requestConfig.tools = this._processTools(options.tools);
      }

      const stream = await this.client.responses.create(requestConfig);
      
      return this._processStream(stream, onEvent);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Handle function calling with automatic execution
   * @param {string|Array} input - Message input
   * @param {Array} functions - Function definitions
   * @param {Object} functionMap - Map of function names to implementations
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response with function results
   */
  async createWithFunctions(input, functions, functionMap, options = {}) {
    try {
      // Convert functions to tools format
      const tools = functions.map(func => ({
        type: 'function',
        name: func.name,
        description: func.description,
        parameters: func.parameters
      }));

      const requestConfig = {
        ...this.defaultConfig,
        ...options,
        input,
        tools,
      };

      // Handle conversation continuity
      if (options.previousResponseId) {
        requestConfig.previous_response_id = options.previousResponseId;
      }

      if (options.instructions && !options.previousResponseId) {
        requestConfig.instructions = options.instructions;
      }

      const response = await this.client.responses.create(requestConfig);
      
      // Check if functions were called
      const functionCalls = this._extractFunctionCalls(response);
      
      if (functionCalls.length > 0) {
        return this._executeFunctionsAndContinue(response, functionCalls, functionMap, options);
      }

      return this._processResponse(response);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Create a conversation manager for stateful interactions
   * @param {string} instructions - System instructions
   * @param {Object} options - Additional options
   * @returns {ConversationManager} Conversation manager instance
   */
  createConversation(instructions, options = {}) {
    return new ConversationManager(this, instructions, options);
  }

  /**
   * Get response with raw HTTP details
   * @param {string|Array} input - Message input
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response with HTTP details
   */
  async createWithRawResponse(input, options = {}) {
    try {
      const requestConfig = {
        ...this.defaultConfig,
        ...options,
        input,
      };

      if (options.previousResponseId) {
        requestConfig.previous_response_id = options.previousResponseId;
      }

      if (options.instructions && !options.previousResponseId) {
        requestConfig.instructions = options.instructions;
      }

      if (options.tools) {
        requestConfig.tools = this._processTools(options.tools);
      }

      const { data: response, response: rawResponse } = await this.client.responses
        .create(requestConfig)
        .withResponse();
      
      return {
        data: this._processResponse(response),
        httpStatus: rawResponse.status,
        headers: Object.fromEntries(rawResponse.headers.entries()),
        requestId: rawResponse.headers.get('x-request-id'),
      };
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Handle sports-specific queries with optimized tools
   * @param {string} query - Sports query
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Optimized sports response
   */
  async handleSportsQuery(query, options = {}) {
    // Determine which tools might be needed based on query content
    const tools = this._determineSportsTools(query);
    
    const sportsInstructions = `You are a knowledgeable sports assistant with access to real-time data and analytics. 
    Provide accurate, up-to-date information about sports statistics, games, players, and fantasy sports.
    Use tools when needed to get the most current information.`;

    return this.createResponse(query, {
      ...options,
      instructions: options.instructions || sportsInstructions,
      tools,
      reasoning: { effort: 'medium' }, // Enable reasoning for complex sports analytics
    });
  }

  // Private methods

  /**
   * Process tools array to ensure proper format
   * @private
   */
  _processTools(tools) {
    return tools.map(tool => {
      if (typeof tool === 'string') {
        return this.availableTools[tool] || { type: tool };
      }
      return tool;
    });
  }

  /**
   * Process response object to extract key information
   * @private
   */
  _processResponse(response) {
    return {
      id: response.id,
      text: response.output_text || this._extractTextFromOutput(response.output),
      output: response.output,
      usage: response.usage,
      created_at: response.created_at,
      model: response.model,
      object: response.object,
      // Helper for accessing response text easily
      get outputText() {
        return this.text;
      }
    };
  }

  /**
   * Extract text content from output array
   * @private
   */
  _extractTextFromOutput(output) {
    if (!Array.isArray(output)) return '';
    
    return output
      .filter(item => item.type === 'message')
      .map(message => {
        if (Array.isArray(message.content)) {
          return message.content
            .filter(content => content.type === 'output_text')
            .map(content => content.text)
            .join('');
        }
        return message.content || '';
      })
      .join('');
  }

  /**
   * Process streaming response
   * @private
   */
  async _processStream(stream, onEvent) {
    let collectedContent = '';
    let responseId = null;

    for await (const event of stream) {
      // Call event handler if provided
      if (onEvent) {
        await onEvent(event);
      }

      // Collect content from streaming events
      if (event.type === 'response.created') {
        responseId = event.response.id;
      } else if (event.type === 'response.output_text.delta') {
        const content = event.delta;
        collectedContent += content;
      } else if (event.type === 'response.error') {
        throw new Error(`Streaming error: ${event.error}`);
      }
    }

    return {
      id: responseId,
      text: collectedContent,
      outputText: collectedContent
    };
  }

  /**
   * Extract function calls from response
   * @private
   */
  _extractFunctionCalls(response) {
    const functionCalls = [];
    
    if (response.output && Array.isArray(response.output)) {
      for (const output of response.output) {
        if (output.type === 'function_call') {
          functionCalls.push({
            id: output.id,
            name: output.name,
            arguments: output.arguments
          });
        }
      }
    }
    
    return functionCalls;
  }

  /**
   * Execute functions and continue conversation
   * @private
   */
  async _executeFunctionsAndContinue(response, functionCalls, functionMap, options) {
    const functionResults = [];

    for (const call of functionCalls) {
      try {
        const functionImpl = functionMap[call.name];
        if (!functionImpl) {
          throw new Error(`Function ${call.name} not found`);
        }

        const result = await functionImpl(call.arguments);
        functionResults.push({
          call_id: call.id,
          name: call.name,
          result: result
        });
      } catch (error) {
        functionResults.push({
          call_id: call.id,
          name: call.name,
          result: `Error: ${error.message}`
        });
      }
    }

    // Continue conversation with function results
    const finalResponse = await this.client.responses.create({
      model: this.defaultConfig.model,
      input: functionResults,
      previous_response_id: response.id,
      store: this.defaultConfig.store,
    });

    return this._processResponse(finalResponse);
  }

  /**
   * Determine appropriate tools for sports queries
   * @private
   */
  _determineSportsTools(query) {
    const tools = [];
    const lowerQuery = query.toLowerCase();

    // Check if web search might be needed
    const webSearchKeywords = ['latest', 'recent', 'current', 'news', 'today', 'live', 'score'];
    if (webSearchKeywords.some(keyword => lowerQuery.includes(keyword))) {
      tools.push({ type: 'web_search' });
    }

    // Always include code interpreter for potential analytics
    if (lowerQuery.includes('analyze') || lowerQuery.includes('statistics') || lowerQuery.includes('calculate')) {
      tools.push({ type: 'code_interpreter' });
    }

    return tools;
  }

  /**
   * Enhanced error handling with specific error types
   * @private
   */
  _handleError(error) {
    // If it's already an OpenAI error, preserve the type
    if (error.constructor.name.includes('OpenAI')) {
      return error;
    }

    // Wrap other errors
    const enhancedError = new Error(`Sports Proxy API Error: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.timestamp = new Date().toISOString();
    
    return enhancedError;
  }
}

/**
 * Conversation Manager for stateful interactions
 */
export class ConversationManager {
  constructor(apiClient, instructions, options = {}) {
    this.api = apiClient;
    this.instructions = instructions;
    this.lastResponseId = null;
    this.options = options;
  }

  /**
   * Send a message in the conversation
   * @param {string|Array} message - Message to send
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response object
   */
  async sendMessage(message, options = {}) {
    const requestOptions = {
      ...this.options,
      ...options,
    };

    // Add instructions only for first message
    if (!this.lastResponseId && this.instructions) {
      requestOptions.instructions = this.instructions;
    }

    // Continue conversation if not first message
    if (this.lastResponseId) {
      requestOptions.previousResponseId = this.lastResponseId;
    }

    const response = await this.api.createResponse(message, requestOptions);
    this.lastResponseId = response.id;
    
    return response;
  }

  /**
   * Send a streaming message
   * @param {string|Array} message - Message to send
   * @param {Function} onEvent - Event handler
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Complete response
   */
  async sendStreamingMessage(message, onEvent, options = {}) {
    const requestOptions = {
      ...this.options,
      ...options,
    };

    if (!this.lastResponseId && this.instructions) {
      requestOptions.instructions = this.instructions;
    }

    if (this.lastResponseId) {
      requestOptions.previousResponseId = this.lastResponseId;
    }

    const response = await this.api.createStreamingResponse(message, requestOptions, onEvent);
    this.lastResponseId = response.id;
    
    return response;
  }

  /**
   * Reset conversation state
   */
  resetConversation() {
    this.lastResponseId = null;
  }

  /**
   * Get conversation ID
   * @returns {string|null} Last response ID
   */
  getConversationId() {
    return this.lastResponseId;
  }
}

/**
 * Utility functions for common sports proxy operations
 */
export const SportsResponsesUtils = {
  /**
   * Create a sports-optimized client
   * @param {string} apiKey - OpenAI API key
   * @param {Object} options - Client options
   * @returns {SportsResponsesAPI} Configured client
   */
  createSportsClient(apiKey, options = {}) {
    return new SportsResponsesAPI(apiKey, {
      timeout: 30000,
      maxRetries: 3,
      ...options
    });
  },

  /**
   * Sports-specific instructions template
   */
  sportsInstructions: {
    fantasy: `You are a fantasy sports expert with deep knowledge of player statistics, matchups, and strategy. 
    Provide actionable fantasy advice based on current data and trends.`,
    
    analysis: `You are a sports analytics expert. Analyze data objectively and provide insights backed by statistics. 
    Use charts and calculations when helpful.`,
    
    general: `You are a knowledgeable sports assistant. Provide accurate, up-to-date information about sports 
    across all major leagues and competitions.`,
  },

  /**
   * Common sports tools combinations
   */
  toolSets: {
    live: [{ type: 'web_search' }],
    analytics: [{ type: 'code_interpreter' }, { type: 'web_search' }],
    research: [{ type: 'web_search' }, { type: 'file_search' }],
  }
};

export default SportsResponsesAPI;