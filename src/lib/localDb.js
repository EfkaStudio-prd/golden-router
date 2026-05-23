const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class LocalDb {
  constructor(dataDir = null) {
    this.dataDir = dataDir || process.env.DATA_DIR || path.join(require('os').homedir(), '.golden-router');
    this.dbPath = path.join(this.dataDir, 'db.json');
    this.data = this.load();
  }

  load() {
    try {
      // Create data directory if not exists
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      // Load db.json or create default
      if (!fs.existsSync(this.dbPath)) {
        const defaultData = this.createDefault();
        this.save(defaultData);
        return defaultData;
      }

      const content = fs.readFileSync(this.dbPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Error loading database:', error);
      return this.createDefault();
    }
  }

  save(data = null) {
    try {
      const dataToSave = data || this.data;
      fs.writeFileSync(this.dbPath, JSON.stringify(dataToSave, null, 2));
    } catch (error) {
      console.error('Error saving database:', error);
      throw error;
    }
  }

  createDefault() {
    return {
      providerConnections: [],
      providerNodes: [],
      modelAliases: [],
      combos: [],
      apiKeys: [],
      accounts: [],
      settings: {
        rtkEnabled: true,
        cavemanEnabled: true,
        cloudSyncEnabled: false,
        logLevel: 'info'
      },
      pricing: {}
    };
  }

  // Provider Connections
  addProviderConnection(connection) {
    this.data.providerConnections.push({
      id: uuidv4(),
      ...connection,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    this.save();
    return this.data.providerConnections[this.data.providerConnections.length - 1];
  }

  getProviderConnection(id) {
    return this.data.providerConnections.find(c => c.id === id);
  }

  updateProviderConnection(id, updates) {
    const index = this.data.providerConnections.findIndex(c => c.id === id);
    if (index !== -1) {
      this.data.providerConnections[index] = {
        ...this.data.providerConnections[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.data.providerConnections[index];
    }
    return null;
  }

  deleteProviderConnection(id) {
    this.data.providerConnections = this.data.providerConnections.filter(c => c.id !== id);
    this.save();
  }

  // Provider Nodes
  addProviderNode(node) {
    this.data.providerNodes.push({
      id: uuidv4(),
      ...node,
      createdAt: new Date().toISOString()
    });
    this.save();
    return this.data.providerNodes[this.data.providerNodes.length - 1];
  }

  // Model Aliases
  addModelAlias(alias) {
    this.data.modelAliases.push({
      id: uuidv4(),
      ...alias,
      createdAt: new Date().toISOString()
    });
    this.save();
    return this.data.modelAliases[this.data.modelAliases.length - 1];
  }

  getModelAlias(alias) {
    return this.data.modelAliases.find(a => a.alias === alias);
  }

  // Combos
  addCombo(combo) {
    this.data.combos.push({
      id: uuidv4(),
      ...combo,
      createdAt: new Date().toISOString()
    });
    this.save();
    return this.data.combos[this.data.combos.length - 1];
  }

  getCombo(identifier) {
    // Try to find by ID first, then by name
    return this.data.combos.find(c => c.id === identifier) || 
           this.data.combos.find(c => c.name === identifier);
  }

  getComboById(id) {
    return this.data.combos.find(c => c.id === id);
  }

  updateCombo(id, updates) {
    const index = this.data.combos.findIndex(c => c.id === id);
    if (index !== -1) {
      this.data.combos[index] = {
        ...this.data.combos[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.data.combos[index];
    }
    return null;
  }

  deleteCombo(id) {
    this.data.combos = this.data.combos.filter(c => c.id !== id);
    this.save();
  }

  // Accounts (Multi-account support)
  addAccount(account) {
    this.data.accounts.push({
      id: uuidv4(),
      ...account,
      createdAt: new Date().toISOString(),
      status: 'active',
      cooldownUntil: null
    });
    this.save();
    return this.data.accounts[this.data.accounts.length - 1];
  }

  getAccounts(provider) {
    if (provider) {
      return this.data.accounts.filter(a => a.provider === provider);
    }
    return this.data.accounts;
  }

  updateAccount(id, updates) {
    const index = this.data.accounts.findIndex(a => a.id === id);
    if (index !== -1) {
      this.data.accounts[index] = {
        ...this.data.accounts[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.data.accounts[index];
    }
    return null;
  }

  markAccountUnavailable(id, cooldownMinutes = 5) {
    const cooldownUntil = new Date();
    cooldownUntil.setMinutes(cooldownUntil.getMinutes() + cooldownMinutes);
    
    return this.updateAccount(id, {
      status: 'unavailable',
      cooldownUntil: cooldownUntil.toISOString()
    });
  }

  isAccountAvailable(account) {
    if (account.status === 'active') {
      return true;
    }
    
    if (account.status === 'unavailable' && account.cooldownUntil) {
      const now = new Date();
      const cooldownUntil = new Date(account.cooldownUntil);
      return now >= cooldownUntil;
    }
    
    return false;
  }

  // API Keys
  addApiKey(apiKey) {
    this.data.apiKeys.push({
      id: uuidv4(),
      ...apiKey,
      createdAt: new Date().toISOString()
    });
    this.save();
    return this.data.apiKeys[this.data.apiKeys.length - 1];
  }

  // Settings
  updateSettings(settings) {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
  }

  getSettings() {
    return this.data.settings;
  }

  // Pricing
  updatePricing(provider, pricing) {
    this.data.pricing[provider] = pricing;
    this.save();
  }

  getPricing(provider) {
    return this.data.pricing[provider];
  }

  // Get all data
  getAll() {
    return this.data;
  }
}

module.exports = LocalDb;
