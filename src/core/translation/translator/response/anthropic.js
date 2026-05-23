/**
 * Anthropic Response Translator
 * Translates responses from various formats to Anthropic format
 */

class AnthropicResponseTranslator {
  async translate(response, sourceFormat) {
    switch (sourceFormat) {
      case 'openai':
        return this.fromOpenAI(response);
      case 'gemini':
        return this.fromGemini(response);
      case 'anthropic':
      default:
        return response;
    }
  }

  fromOpenAI(response) {
    const choice = response.choices?.[0];
    
    return {
      id: response.id,
      type: 'message',
      role: 'assistant',
      content: [{
        type: 'text',
        text: choice?.message?.content || ''
      }],
      model: response.model,
      stop_reason: choice?.finish_reason || 'stop',
      usage: {
        input_tokens: response.usage?.prompt_tokens || 0,
        output_tokens: response.usage?.completion_tokens || 0
      }
    };
  }

  fromGemini(response) {
    const content = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return {
      id: 'msg-' + Date.now(),
      type: 'message',
      role: 'assistant',
      content: [{
        type: 'text',
        text: content
      }],
      model: response.model,
      stop_reason: response.candidates?.[0]?.finishReason || 'stop',
      usage: {
        input_tokens: response.usageMetadata?.promptTokenCount || 0,
        output_tokens: response.usageMetadata?.candidatesTokenCount || 0
      }
    };
  }
}

module.exports = AnthropicResponseTranslator;
