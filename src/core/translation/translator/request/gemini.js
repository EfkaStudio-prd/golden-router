/**
 * Gemini Request Translator
 * Translates requests from various formats to Gemini format
 */

class GeminiRequestTranslator {
  async translate(request, sourceFormat) {
    switch (sourceFormat) {
      case 'openai':
        return this.fromOpenAI(request);
      case 'anthropic':
        return this.fromAnthropic(request);
      case 'gemini':
      default:
        return request;
    }
  }

  fromOpenAI(request) {
    const contents = [];
    
    if (request.messages) {
      for (const msg of request.messages) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }

    return {
      model: request.model,
      contents,
      generationConfig: {
        maxOutputTokens: request.max_tokens,
        temperature: request.temperature,
        topP: request.top_p
      }
    };
  }

  fromAnthropic(request) {
    const contents = [];
    
    if (request.messages) {
      for (const msg of request.messages) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }

    return {
      model: request.model,
      contents,
      generationConfig: {
        maxOutputTokens: request.max_tokens,
        temperature: request.temperature,
        topP: request.top_p
      }
    };
  }
}

module.exports = GeminiRequestTranslator;
