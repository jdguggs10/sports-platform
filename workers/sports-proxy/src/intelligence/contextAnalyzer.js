/**
 * Handles sport detection, intent extraction, and entity recognition.
 */
class ContextAnalyzer {
  constructor(env) {
    this.env = env;
  }

  /**
   * Generate contextual response based on processed input and selected sport
   */
  generateContextualResponse(processedInput, sport = 'sport-null') { // Added sport parameter
    const userMessages = Array.isArray(processedInput)
      ? processedInput.filter(msg => msg.role === 'user')
      : [{ content: processedInput }];

    const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';

    // Generic greeting, will be enhanced by available tools for the sport
    if (lastUserMessage.toLowerCase().includes('hello') ||
        lastUserMessage.toLowerCase().includes('hi') ||
        lastUserMessage.toLowerCase().includes('are you there')) {
      return `Hello! I'm here and ready to help you with ${sport} data. What would you like to know?`;
    }

    if (lastUserMessage.toLowerCase().includes('help')) {
      // The actual list of tools will be provided by the ToolHandler based on the sport.
      // This message can be made more generic or dynamically list tools if ToolHandler is accessible here.
      return `I can help you with ${sport} data. Please ask a specific question, and I'll use the available tools to find the information.`;
    }
    return `I can help you with ${sport} data. What would you like to know?`;
  }
}

module.exports = { ContextAnalyzer };