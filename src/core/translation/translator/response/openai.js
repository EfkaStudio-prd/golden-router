/**
 * OpenAI Response Translator
 * Translates responses from various formats to OpenAI format
 */

class OpenAIResponseTranslator {
  async translate(response, sourceFormat) {
    switch (sourceFormat) {
      case 'anthropic':
        return this.fromAnthropic(response);
      case 'gemini':
        return this.fromGemini(response);
      case 'openai':
      default:
        return response;
    }
  }

  fromAnthropic(response) {
    return {
      id: response.id || 'chatcmpl-' + Date.now(),
      object: 'chat.completion',
      created: Date.now(),
      model: response.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: response.content?.[0]?.text || response.content || ''
        },
        finish_reason: response.stop_reason || 'stop'
      }],
      usage: {
        prompt_tokens: response.usage?.input_tokens || 0,
        completion_tokens: response.usage?.output_tokens || 0,
        total_tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
      }
    };
  }

  fromGemini(response) {
    const content = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return {
      id: 'chatcmpl-' + Date.now(),
      object: 'chat.completion',
      created: Date.now(),
      model: response.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content
        },
        finish_reason: response.candidates?.[0]?.finishReason || 'stop'
      }],
      usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: response.usageMetadata?.totalTokenCount || 0
      }
    };
  }
}

module.exports = OpenAIResponseTranslator;
