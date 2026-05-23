const ProviderExecutor = require('../providers/providerExecutor');
const ComboHandler = require('../combo/comboHandler');
const TranslatorRegistry = require('../translation/translator/index');
const LocalDb = require('../../lib/localDb');
const UsageDb = require('../../lib/usageDb');
const QuotaTracker = require('../quota/quotaTracker');

/**
 * Golden Router Routing Engine
 * Core routing logic forked from OmniRoute
 * Supports combo fallback, multi-account, format translation
 */

class RoutingEngine {
  constructor() {
    this.localDb = new LocalDb();
    this.usageDb = new UsageDb();
    this.quotaTracker = new QuotaTracker(this.usageDb);
    this.providerExecutor = new ProviderExecutor();
    this.comboHandler = new ComboHandler(this.localDb);
    this.translatorRegistry = new TranslatorRegistry();

    // Register translators
    this.registerTranslators();
  }

  /**
   * Register format translators
   */
  registerTranslators() {
    const OpenAIRequestTranslator = require('../translation/translator/request/openai');
    const AnthropicRequestTranslator = require('../translation/translator/request/anthropic');
    const GeminiRequestTranslator = require('../translation/translator/request/gemini');
    const OpenAIResponseTranslator = require('../translation/translator/response/openai');
    const AnthropicResponseTranslator = require('../translation/translator/response/anthropic');
    const GeminiResponseTranslator = require('../translation/translator/response/gemini');

    this.translatorRegistry.registerRequestTranslator('openai', new OpenAIRequestTranslator());
    this.translatorRegistry.registerRequestTranslator('anthropic', new AnthropicRequestTranslator());
    this.translatorRegistry.registerRequestTranslator('gemini', new GeminiRequestTranslator());
    this.translatorRegistry.registerResponseTranslator('openai', new OpenAIResponseTranslator());
    this.translatorRegistry.registerResponseTranslator('anthropic', new AnthropicResponseTranslator());
    this.translatorRegistry.registerResponseTranslator('gemini', new GeminiResponseTranslator());
  }

  /**
   * Route request
   */
  async route(request) {
    const startTime = Date.now();

    try {
      // Detect source format
      const sourceFormat = this.translatorRegistry.detectFormat(request);

      // Determine if this is a combo or single model
      const modelName = request.model;
      const combo = this.localDb.getCombo(modelName);

      let result;

      if (combo) {
        // Use combo fallback
        result = await this.routeWithCombo(combo, request, sourceFormat);
      } else {
        // Single model routing
        result = await this.routeSingle(modelName, request, sourceFormat);
      }

      const duration = Date.now() - startTime;

      // Track usage
      if (result.success && result.usage) {
        await this.quotaTracker.trackUsage(
          result.provider,
          result.usage.inputTokens,
          result.usage.outputTokens
        );

        // Log request
        this.usageDb.logRequest(request, result.data, {
          provider: result.provider,
          model: result.model,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          cost: result.cost || 0,
          duration,
          status: 'success'
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      this.usageDb.logRequest(request, null, {
        provider: 'unknown',
        model: request.model,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        duration,
        status: 'error',
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        duration
      };
    }
  }

  /**
   * Route with combo fallback
   */
  async routeWithCombo(combo, request, sourceFormat) {
    for (const modelConfig of combo.models) {
      try {
        const result = await this.routeSingle(
          modelConfig.model,
          request,
          sourceFormat,
          modelConfig.provider
        );

        if (result.success) {
          return {
            ...result,
            combo: combo.name,
            fallbackUsed: modelConfig.priority > 1
          };
        }
      } catch (error) {
        console.error(`Combo model failed: ${modelConfig.provider}/${modelConfig.model}`, error);
        continue;
      }
    }

    throw new Error('All models in combo failed');
  }

  /**
   * Route single model
   */
  async routeSingle(modelName, request, sourceFormat, providerOverride = null) {
    // Parse model name to extract provider if not provided
    const provider = providerOverride || this.extractProvider(modelName);
    const model = this.extractModelName(modelName);

    // Get account for provider
    const account = await this.selectAccount(provider);
    if (!account) {
      throw new Error(`No available account for provider: ${provider}`);
    }

    // Get provider connection
    const connection = this.localDb.getProviderConnection(account.connectionId);
    if (!connection) {
      throw new Error(`No connection found for account: ${account.id}`);
    }

    // Translate request to provider format
    const providerFormat = this.getProviderFormat(provider);
    const translatedRequest = await this.translatorRegistry.translateRequest(
      sourceFormat,
      providerFormat,
      request
    );

    // Execute request
    const executionResult = await this.providerExecutor.execute(
      provider,
      model,
      translatedRequest,
      connection.credentials
    );

    if (!executionResult.success) {
      throw new Error(executionResult.error);
    }

    // Translate response back to source format
    const translatedResponse = await this.translatorRegistry.translateResponse(
      providerFormat,
      sourceFormat,
      executionResult.data
    );

    // Extract usage
    const usage = this.extractUsage(executionResult.data, providerFormat);

    // Calculate cost
    const cost = this.quotaTracker.estimateCost(
      provider,
      usage.inputTokens,
      usage.outputTokens
    );

    return {
      success: true,
      data: translatedResponse,
      provider,
      model,
      usage,
      cost,
      duration: executionResult.duration
    };
  }

  /**
   * Select account for provider
   */
  async selectAccount(provider) {
    const accounts = this.localDb.getAccounts(provider);
    
    if (!accounts || accounts.length === 0) {
      return null;
    }

    // Priority-based selection
    const sorted = accounts.sort((a, b) => a.priority - b.priority);

    for (const account of sorted) {
      if (this.localDb.isAccountAvailable(account)) {
        return account;
      }
    }

    return null;
  }

  /**
   * Extract provider from model name
   */
  extractProvider(modelName) {
    if (modelName.includes('/')) {
      return modelName.split('/')[0];
    }
    if (modelName.includes(':')) {
      return modelName.split(':')[0];
    }
    return 'openai'; // Default
  }

  /**
   * Extract model name from full model string
   */
  extractModelName(modelName) {
    if (modelName.includes('/')) {
      return modelName.split('/')[1];
    }
    if (modelName.includes(':')) {
      return modelName.split(':')[1];
    }
    return modelName;
  }

  /**
   * Get provider format
   */
  getProviderFormat(provider) {
    const providerConfig = this.providerExecutor.getProvider(provider);
    return providerConfig?.format || 'openai';
  }

  /**
   * Extract usage from response
   */
  extractUsage(response, format) {
    switch (format) {
      case 'anthropic':
        return {
          inputTokens: response.usage?.input_tokens || 0,
          outputTokens: response.usage?.output_tokens || 0
        };
      case 'gemini':
        return {
          inputTokens: response.usageMetadata?.promptTokenCount || 0,
          outputTokens: response.usageMetadata?.candidatesTokenCount || 0
        };
      case 'openai':
      default:
        return {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0
        };
    }
  }
}

module.exports = RoutingEngine;
