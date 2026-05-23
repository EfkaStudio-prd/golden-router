/**
 * Gemini Response Translator
 * Translates responses from various formats to Gemini format
 */

class GeminiResponseTranslator {
  async translate(response, sourceFormat) {
    switch (sourceFormat) {
      case 'openai':
        return this.fromOpenAI(response);
      case 'anthropic':
        return this.fromAnthropic(response);
      case 'gemini':
      default:
        return response;
    }
  }

  fromOpenAI(response) {
    const choice = response.choices?.[0];
    
    return {
      candidates: [{
        content: {
          parts: [{ text: choice?.message?.content || '' }],
          role: 'model'
        },
        finishReason: choice?.finish_reason || 'STOP',
        index: 0
      }],
      usageMetadata: {
        promptTokenCount: response.usage?.prompt_tokens || 0,
        candidatesTokenCount: response.usage?.completion_tokens || 0,
        totalTokenCount: response.usage?.total_tokens || 0
      },
      model: response.model
    };
  }

  fromAnthropic(response) {
    const text = response.content?.[0]?.text || response.content || '';
    
    return {
      candidates: [{
        content: {
          parts: [{ text }],
          role: 'model'
        },
        finishReason: response.stop_reason || 'STOP',
        index: 0
      }],
      usageMetadata: {
        promptTokenCount: response.usage?.input_tokens || 0,
        candidatesTokenCount: response.usage?.output_tokens || 0,
        totalTokenCount: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
      },
      model: response.model
    };
  }
}

module.exports = GeminiResponseTranslator;
