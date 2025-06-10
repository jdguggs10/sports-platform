/**
 * Sports Proxy Configuration
 * Centralized configuration constants for the Sports Proxy Worker
 */

// Default OpenAI model configuration
export const DEFAULT_MODEL = 'gpt-4.1-mini';
export const RESOLVER_MODEL = 'gpt-4.1-nano';

// API Configuration
export const API_CONFIG = {
  model: DEFAULT_MODEL,
  temperature: 0.7,
  max_output_tokens: 1000,
  store: true, // Enable server-side state management
};

// Rate limiting configuration
export const RATE_LIMITS = {
  free: { requests_per_hour: 100, concurrent: 2, tools_per_request: 3 },
  pro: { requests_per_hour: 1000, concurrent: 5, tools_per_request: 3 },
  elite: { requests_per_hour: 10000, concurrent: 10, tools_per_request: 3 }
};

// Cache configuration
export const CACHE_CONFIG = {
  user_memory_timeout: 30 * 60 * 1000, // 30 minutes
  prompt_cache_timeout: 5 * 60 * 1000,  // 5 minutes
  max_user_memory_size: 5000            // Max characters
};