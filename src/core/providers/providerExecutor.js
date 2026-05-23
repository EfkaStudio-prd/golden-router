const fetch = require('node-fetch');

/**
 * Golden Router Provider Executor
 * Executes requests to various LLM providers
 * Forked core functionality from OmniRoute
 */

class ProviderExecutor {
  constructor() {
    this.providers = {
      openai: {
        baseUrl: 'https://api.openai.com/v1',
        format: 'openai'
      },
      anthropic: {
        baseUrl: 'https://api.anthropic.com/v1',
        format: 'anthropic'
      },
      gemini: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        format: 'gemini'
      },
      deepseek: {
        baseUrl: 'https://api.deepseek.com/v1',
        format: 'openai'
      },
      groq: {
        baseUrl: 'https://api.groq.com/openai/v1',
        format: 'openai'
      },
      openrouter: {
        baseUrl: 'https://openrouter.ai/api/v1',
        format: 'openai'
      }
    };
  }

  /**
   * Execute request to provider
   */
  async execute(provider, model, request, credentials) {
    const providerConfig = this.providers[provider] || this.providers.openai;
    const baseUrl = credentials.baseUrl || providerConfig.baseUrl;
    const apiKey = credentials.apiKey || credentials.accessToken;

    if (!apiKey) {
      throw new Error(`No API key provided for provider: ${provider}`);
    }

    const headers = this.buildHeaders(provider, apiKey, providerConfig.format);
    const body = this.buildBody(provider, model, request, providerConfig.format);
    const endpoint = this.getEndpoint(provider, providerConfig.format);

    const startTime = Date.now();

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Provider error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        duration,
        provider,
        model
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error.message,
        duration,
        provider,
        model
      };
    }
  }

  /**
   * Build headers for provider
   */
  buildHeaders(provider, apiKey, format) {
    const headers = {
      'Content-Type': 'application/json'
    };

    switch (format) {
      case 'anthropic':
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        break;
      case 'gemini':
        headers['x-goog-api-key'] = apiKey;
        break;
      case 'openai':
      default:
        headers['Authorization'] = `Bearer ${apiKey}`;
        break;
    }

    return headers;
  }

  /**
   * Build request body for provider
   */
  buildBody(provider, model, request, format) {
    switch (format) {
      case 'anthropic':
        return {
          model: model,
          messages: request.messages || [{ role: 'user', content: request.prompt }],
          max_tokens: request.max_tokens || 4096,
          temperature: request.temperature || 0.7,
          stream: request.stream || false
        };
      case 'gemini':
        return {
          contents: request.messages?.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          })) || [{ role: 'user', parts: [{ text: request.prompt }] }],
          generationConfig: {
            maxOutputTokens: request.max_tokens || 4096,
            temperature: request.temperature || 0.7
          }
        };
      case 'openai':
      default:
        return {
          model: model,
          messages: request.messages || [{ role: 'user', content: request.prompt }],
          max_tokens: request.max_tokens || 4096,
          temperature: request.temperature || 0.7,
          stream: request.stream || false
        };
    }
  }

  /**
   * Get endpoint for provider
   */
  getEndpoint(provider, format) {
    switch (format) {
      case 'anthropic':
        return '/messages';
      case 'gemini':
        return '/models/gemini-pro:generateContent';
      case 'openai':
      default:
        return '/chat/completions';
    }
  }

  /**
   * Add custom provider
   */
  addProvider(name, config) {
    this.providers[name] = config;
  }

  /**
   * Get provider config
   */
  getProvider(name) {
    return this.providers[name];
  }

  /**
   * List all providers
   */
  listProviders() {
    return Object.keys(this.providers);
  }
}

module.exports = ProviderExecutor;
