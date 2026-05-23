/**
 * OpenAI Request Translator
 * Translates requests from various formats to OpenAI format
 */

class OpenAIRequestTranslator {
  async translate(request, sourceFormat) {
    switch (sourceFormat) {
      case 'anthropic':
        return this.fromAnthropic(request);
      case 'gemini':
        return this.fromGemini(request);
      case 'openai':
      default:
        return request;
    }
  }

  fromAnthropic(request) {
    return {
      model: request.model,
      messages: request.messages || [{ role: 'user', content: request.prompt }],
      max_tokens: request.max_tokens,
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
            role: content.role === 'user' ? 'user' : 'model',
            content: content.parts[0].text
          });
        }
      }
    }

    return {
      model: request.model,
      messages,
      max_tokens: request.generationConfig?.maxOutputTokens,
      temperature: request.generationConfig?.temperature,
      stream: false
    };
  }
}

module.exports = OpenAIRequestTranslator;
