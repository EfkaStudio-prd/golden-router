const LocalDb = require('../../lib/localDb');

class ComboHandler {
  constructor(localDb) {
    this.localDb = localDb || new LocalDb();
  }

  async handleCombo(comboName, request) {
    const combo = this.localDb.getCombo(comboName);
    
    if (!combo) {
      throw new Error(`Combo "${comboName}" not found`);
    }

    // Sort models by priority
    const sortedModels = combo.models.sort((a, b) => a.priority - b.priority);

    for (const modelConfig of sortedModels) {
      try {
        // Select account based on priority
        const account = await this.selectAccount(modelConfig.provider);
        
        if (!account) {
          console.log(`No available accounts for provider: ${modelConfig.provider}`);
          continue;
        }

        // Execute request (this would call the actual provider executor)
        const response = await this.executeRequest(modelConfig, account, request);
        
        // Success - return response
        return {
          success: true,
          model: modelConfig.model,
          provider: modelConfig.provider,
          account: account.id,
          response
        };
      } catch (error) {
        console.error(`Error with ${modelConfig.provider}/${modelConfig.model}:`, error.message);
        
        // Check if error is fallback-eligible
        if (this.isFallbackEligible(error)) {
          // Mark account unavailable (cooldown)
          const account = await this.selectAccount(modelConfig.provider);
          if (account) {
            await this.localDb.markAccountUnavailable(account.id, 5);
          }
          
          // Try next model in combo
          console.log(`Falling back to next model in combo...`);
          continue;
        }
        
        // Non-fallback error - throw
        throw error;
      }
    }
    
    // All models failed
    throw new Error('All models in combo failed');
  }

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

  isFallbackEligible(error) {
    // Fallback eligible error codes
    const fallbackCodes = [401, 403, 429, 502, 503, 504];
    
    if (error.status && fallbackCodes.includes(error.status)) {
      return true;
    }
    
    // Check error message for quota/rate limit keywords
    const errorMessage = error.message || '';
    const fallbackKeywords = ['quota', 'rate limit', 'exceeded', 'limit reached', 'insufficient'];
    
    return fallbackKeywords.some(keyword => 
      errorMessage.toLowerCase().includes(keyword)
    );
  }

  async executeRequest(modelConfig, account, request) {
    // This is a placeholder - in real implementation, this would:
    // 1. Translate request to provider format
    // 2. Call provider API with account credentials
    // 3. Translate response back to client format
    // 4. Track usage
    
    console.log(`Executing request with ${modelConfig.provider}/${modelConfig.model} using account ${account.id}`);
    
    // Simulate API call
    return {
      model: modelConfig.model,
      provider: modelConfig.provider,
      message: "This is a placeholder response. Implement actual provider executor."
    };
  }

  // Create a new combo
  createCombo(comboData) {
    const { name, models, fallbackStrategy = 'sequential' } = comboData;
    
    if (!name || !models || models.length === 0) {
      throw new Error('Combo name and models are required');
    }

    return this.localDb.addCombo({
      name,
      models,
      fallbackStrategy
    });
  }

  // Update existing combo
  updateCombo(id, updates) {
    return this.localDb.updateCombo(id, updates);
  }

  // Delete combo
  deleteCombo(id) {
    return this.localDb.deleteCombo(id);
  }

  // Get all combos
  getAllCombos() {
    return this.localDb.data.combos;
  }

  // Get combo by ID
  getComboById(id) {
    return this.localDb.getComboById(id);
  }

  // Get combo by ID or name
  getCombo(identifier) {
    return this.localDb.getCombo(identifier);
  }
}

module.exports = ComboHandler;
