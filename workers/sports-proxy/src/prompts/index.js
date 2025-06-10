/**
 * Prompts Module Index
 * Centralized exports for all prompt modules
 */

// Import all prompt modules
import { generalPrompts, getGeneralPrompt, getGeneralPromptTypes } from './general.js';
import { baseballPrompts, getBaseballPrompt, getBaseballPromptTypes } from './baseball.js';
import { hockeyPrompts, getHockeyPrompt, getHockeyPromptTypes } from './hockey.js';
import { footballPrompts, getFootballPrompt, getFootballPromptTypes } from './football.js';

/**
 * Combined prompts object for easy access
 */
export const allPrompts = {
  general: generalPrompts,
  baseball: baseballPrompts,
  hockey: hockeyPrompts,
  football: footballPrompts
};

/**
 * Get prompt by sport and type
 */
export function getPrompt(sport, type = null) {
  // Handle legacy single-argument calls - sport name means get main prompt for that sport
  if (!type) {
    type = sport; // Use sport name as the type
  }

  switch (sport.toLowerCase()) {
    case 'general':
    case 'fantasy':
      return getGeneralPrompt(type);
    case 'baseball':
    case 'mlb':
      return getBaseballPrompt(type);
    case 'hockey':
    case 'nhl':
      return getHockeyPrompt(type);
    case 'football':
    case 'nfl':
      return getFootballPrompt(type);
    default:
      // Fallback to general prompt
      return getGeneralPrompt('general');
  }
}

/**
 * Get all available prompt types for a sport
 */
export function getPromptTypes(sport) {
  switch (sport.toLowerCase()) {
    case 'general':
      return getGeneralPromptTypes();
    case 'baseball':
    case 'mlb':
      return getBaseballPromptTypes();
    case 'hockey':
    case 'nhl':
      return getHockeyPromptTypes();
    case 'football':
    case 'nfl':
      return getFootballPromptTypes();
    default:
      return getGeneralPromptTypes();
  }
}

/**
 * Get list of all supported sports
 */
export function getSupportedSports() {
  return ['general', 'baseball', 'hockey', 'football'];
}

/**
 * Legacy function for backward compatibility
 * Maps old sport names to new prompt structure
 */
export function getDefaultPrompt(sport) {
  const sportMap = {
    general: 'general',
    baseball: 'baseball',
    hockey: 'hockey', 
    football: 'football',
    fantasy: 'fantasy'
  };

  const mappedSport = sportMap[sport] || 'general';
  
  if (mappedSport === 'fantasy') {
    return getGeneralPrompt('fantasy');
  }
  
  return getPrompt(mappedSport, mappedSport);
}

// Export individual modules for direct access
export {
  generalPrompts,
  getGeneralPrompt,
  getGeneralPromptTypes,
  baseballPrompts,
  getBaseballPrompt,
  getBaseballPromptTypes,
  hockeyPrompts,
  getHockeyPrompt,
  getHockeyPromptTypes,
  footballPrompts,
  getFootballPrompt,
  getFootballPromptTypes
};

export default allPrompts;
