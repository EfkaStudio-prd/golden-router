const UsageDb = require('../../lib/usageDb');

class QuotaTracker {
  constructor(usageDb) {
    this.usageDb = usageDb || new UsageDb();
  }

  async trackUsage(provider, inputTokens, outputTokens) {
    const pricing = this.usageDb.data.pricing[provider] || {
      input: 0,
      output: 0,
      currency: 'USD'
    };

    const cost = this.calculateCost(pricing, inputTokens, outputTokens);
    
    this.usageDb.trackUsage(provider, inputTokens, outputTokens, cost);
    
    const quota = this.usageDb.getProviderQuota(provider);
    
    // Check if quota exceeded
    if (quota && quota.tokensRemaining <= 0) {
      console.warn(`Quota exceeded for provider: ${provider}`);
      await this.markProviderExhausted(provider);
    }
    
    return quota;
  }

  calculateCost(pricing, inputTokens, outputTokens) {
    const inputCost = (inputTokens / 1000000) * (pricing.input || 0);
    const outputCost = (outputTokens / 1000000) * (pricing.output || 0);
    return inputCost + outputCost;
  }

  async markProviderExhausted(provider) {
    // This would mark the provider as exhausted in the database
    // and trigger fallback to next provider/combo
    console.log(`Provider ${provider} marked as exhausted`);
  }

  async getQuotaStatus() {
    const quotas = this.usageDb.getAllQuotas();
    
    return {
      providers: quotas.map(q => ({
        provider: q.provider,
        tokensUsed: q.tokensUsed,
        tokensRemaining: q.tokensRemaining,
        maxTokens: q.maxTokens,
        resetAt: q.resetAt,
        cost: q.cost,
        currency: q.currency,
        percentageUsed: q.percentageUsed
      })),
      monthly: this.usageDb.getMonthlyReport()
    };
  }

  async getProviderQuota(provider) {
    return this.usageDb.getProviderQuota(provider);
  }

  async setProviderQuota(provider, maxTokens, resetAt) {
    this.usageDb.setProviderQuota(provider, maxTokens, resetAt);
  }

  async getMonthlyReport(month = null) {
    return this.usageDb.getMonthlyReport(month);
  }

  async getAllMonthlyReports() {
    return this.usageDb.getAllMonthlyReports();
  }

  updatePricing(provider, pricing) {
    this.usageDb.data.pricing[provider] = pricing;
  }

  /**
   * Get cost estimation for a request
   */
  estimateCost(provider, inputTokens, outputTokens) {
    const pricing = this.usageDb.data.pricing[provider] || {
      input: 0,
      output: 0,
      currency: 'USD'
    };

    return this.calculateCost(pricing, inputTokens, outputTokens);
  }

  /**
   * Get pricing for all providers
   */
  getAllPricing() {
    return this.usageDb.data.pricing;
  }

  /**
   * Set pricing for a provider
   */
  setPricing(provider, pricing) {
    this.usageDb.data.pricing[provider] = {
      input: pricing.input || 0,
      output: pricing.output || 0,
      currency: pricing.currency || 'USD'
    };
    this.usageDb.save();
  }
}

module.exports = QuotaTracker;
