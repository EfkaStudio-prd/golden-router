/**
 * Golden Router Format Translation Layer
 * Supports translation between 8 formats: OpenAI, Anthropic, Gemini, Cursor, Kiro, Vertex, Antigravity, Ollama
 */

class TranslatorRegistry {
  constructor() {
    this.requestTranslators = {};
    this.responseTranslators = {};
    this.formats = {
      OPENAI: 'openai',
      ANTHROPIC: 'anthropic',
      GEMINI: 'gemini',
      CURSOR: 'cursor',
      KIRO: 'kiro',
      VERTEX: 'vertex',
      ANTIGRAVITY: 'antigravity',
      OLLAMA: 'ollama'
    };
  }

  registerRequestTranslator(format, translator) {
    this.requestTranslators[format] = translator;
  }

  registerResponseTranslator(format, translator) {
    this.responseTranslators[format] = translator;
  }

  async translateRequest(sourceFormat, targetFormat, request) {
    const translator = this.requestTranslators[targetFormat];
    if (!translator) {
      throw new Error(`No request translator found for format: ${targetFormat}`);
    }
    return await translator.translate(request, sourceFormat);
  }

  async translateResponse(sourceFormat, targetFormat, response) {
    const translator = this.responseTranslators[targetFormat];
    if (!translator) {
      throw new Error(`No response translator found for format: ${targetFormat}`);
    }
    return await translator.translate(response, sourceFormat);
  }

  detectFormat(request) {
    // Auto-detect format from request structure
    if (request.messages && Array.isArray(request.messages)) {
      return this.formats.OPENAI;
    }
    if (request.prompt || (request.messages && request.messages[0]?.role === 'user')) {
      return this.formats.ANTHROPIC;
    }
    if (request.contents || request.generationConfig) {
      return this.formats.GEMINI;
    }
    if (request.model && request.stream !== undefined) {
      return this.formats.CURSOR;
    }
    if (request.model && request.provider) {
      return this.formats.KIRO;
    }
    if (request.instances || request.parameters) {
      return this.formats.VERTEX;
    }
    if (request.model && request.options) {
      return this.formats.ANTIGRAVITY;
    }
    if (request.model && request.raw) {
      return this.formats.OLLAMA;
    }
    
    // Default to OpenAI
    return this.formats.OPENAI;
  }

  getAvailableFormats() {
    return Object.values(this.formats);
  }
}

module.exports = TranslatorRegistry;
