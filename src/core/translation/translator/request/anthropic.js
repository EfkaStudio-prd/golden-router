/**
 * Anthropic Request Translator
 * Translates requests from various formats to Anthropic format
 */

class AnthropicRequestTranslator {
  async translate(request, sourceFormat) {
    switch (sourceFormat) {
      case 'openai':
        return this.fromOpenAI(request);
      case 'gemini':
        return this.fromGemini(request);
      case 'anthropic':
      default:
        return request;
    }
  }

  fromOpenAI(request) {
    const messages = request.messages || [];
    
    // Convert OpenAI messages to Anthropic format
    const anthropicMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    return {
      model: request.model,
      messages: anthropicMessages,
      max_tokens: request.max_tokens || 4096,
      temperature: request.temperature,
      top_p: request.top_p,
      stream: request.stream || false
    };
  }

  fromGemini(request) {
    const messages = [];
    
    if (request.contents) {
      for (const content of request.contents) {
        if (content.parts && content.parts[0]) {
          messages.push({
            role: content.role === 'user' ? 'user' : 'assistant',
            content: content.parts[0].text
          });
        }
      }
    }

    return {
      model: request.model,
      messages,
      max_tokens: request.generationConfig?.maxOutputTokens || 4096,
      temperature: request.generationConfig?.temperature
    };
  }
}

module.exports = AnthropicRequestTranslator;
