const fs = require('fs');
const path = require('path');

class UsageDb {
  constructor(dataDir = null) {
    this.dataDir = dataDir || process.env.DATA_DIR || path.join(require('os').homedir(), '.golden-router');
    this.usagePath = path.join(this.dataDir, 'usage.json');
    this.logPath = path.join(this.dataDir, 'log.txt');
    this.data = this.load();
  }

  load() {
    try {
      // Create data directory if not exists
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      // Load usage.json or create default
      if (!fs.existsSync(this.usagePath)) {
        const defaultData = this.createDefault();
        this.save(defaultData);
        return defaultData;
      }

      const content = fs.readFileSync(this.usagePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Error loading usage database:', error);
      return this.createDefault();
    }
  }

  save(data = null) {
    try {
      const dataToSave = data || this.data;
      fs.writeFileSync(this.usagePath, JSON.stringify(dataToSave, null, 2));
    } catch (error) {
      console.error('Error saving usage database:', error);
      throw error;
    }
  }

  createDefault() {
    return {
      providers: {},
      monthly: {},
      pricing: {}
    };
  }

  trackUsage(provider, inputTokens, outputTokens, cost) {
    if (!this.data.providers[provider]) {
      this.data.providers[provider] = {
        tokensUsed: 0,
        tokensRemaining: 0,
        maxTokens: 0,
        resetAt: null,
        cost: 0,
        currency: 'USD'
      };
    }

    this.data.providers[provider].tokensUsed += inputTokens + outputTokens;
    this.data.providers[provider].cost += cost;

    // Update monthly
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    if (!this.data.monthly[currentMonth]) {
      this.data.monthly[currentMonth] = {
        totalCost: 0,
        totalTokens: 0,
        requests: 0
      };
    }

    this.data.monthly[currentMonth].totalCost += cost;
    this.data.monthly[currentMonth].totalTokens += inputTokens + outputTokens;
    this.data.monthly[currentMonth].requests += 1;

    this.save();
  }

  setProviderQuota(provider, maxTokens, resetAt) {
    if (!this.data.providers[provider]) {
      this.data.providers[provider] = {
        tokensUsed: 0,
        tokensRemaining: maxTokens,
        maxTokens,
        resetAt,
        cost: 0,
        currency: 'USD'
      };
    } else {
      this.data.providers[provider].maxTokens = maxTokens;
      this.data.providers[provider].resetAt = resetAt;
      this.data.providers[provider].tokensRemaining = this.calculateRemaining(this.data.providers[provider]);
    }
    this.save();
  }

  calculateRemaining(quota) {
    const now = new Date();
    const resetAt = quota.resetAt ? new Date(quota.resetAt) : null;

    if (resetAt && now >= resetAt) {
      // Reset quota
      return quota.maxTokens;
    }

    return quota.maxTokens - quota.tokensUsed;
  }

  getProviderQuota(provider) {
    const quota = this.data.providers[provider];
    if (!quota) {
      return null;
    }

    // Check if quota needs reset
    const now = new Date();
    const resetAt = quota.resetAt ? new Date(quota.resetAt) : null;

    if (resetAt && now >= resetAt) {
      // Reset quota
      quota.tokensUsed = 0;
      quota.tokensRemaining = quota.maxTokens;
      this.save();
    }

    return {
      ...quota,
      tokensRemaining: this.calculateRemaining(quota),
      percentageUsed: quota.maxTokens > 0 ? (quota.tokensUsed / quota.maxTokens) * 100 : 0
    };
  }

  getAllQuotas() {
    const quotas = [];
    for (const provider in this.data.providers) {
      quotas.push(this.getProviderQuota(provider));
    }
    return quotas;
  }

  getMonthlyReport(month = null) {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    return this.data.monthly[targetMonth] || {
      totalCost: 0,
      totalTokens: 0,
      requests: 0
    };
  }

  getAllMonthlyReports() {
    return this.data.monthly;
  }

  logRequest(request, response, metadata) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      provider: metadata.provider,
      model: metadata.model,
      inputTokens: metadata.inputTokens || 0,
      outputTokens: metadata.outputTokens || 0,
      cost: metadata.cost || 0,
      duration: metadata.duration || 0,
      status: metadata.status || 'success',
      error: metadata.error || null,
      level: metadata.level || 'info',
      requestId: metadata.requestId || this.generateRequestId()
    };

    try {
      fs.appendFileSync(this.logPath, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  generateRequestId() {
    return 'req-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Log with specific level
   */
  logWithLevel(level, request, response, metadata) {
    return this.logRequest(request, response, {
      ...metadata,
      level
    });
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level, limit = 100) {
    const allLogs = this.getLogs();
    return allLogs.filter(log => log.level === level).slice(-limit);
  }

  /**
   * Get logs filtered by provider
   */
  getLogsByProvider(provider, limit = 100) {
    const allLogs = this.getLogs();
    return allLogs.filter(log => log.provider === provider).slice(-limit);
  }

  /**
   * Get logs filtered by status
   */
  getLogsByStatus(status, limit = 100) {
    const allLogs = this.getLogs();
    return allLogs.filter(log => log.status === status).slice(-limit);
  }

  getLogs(limit = 100) {
    try {
      if (!fs.existsSync(this.logPath)) {
        return [];
      }

      const content = fs.readFileSync(this.logPath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      const logs = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      }).filter(log => log !== null);

      // Return last N logs
      return logs.slice(-limit);
    } catch (error) {
      console.error('Error reading log file:', error);
      return [];
    }
  }

  clearLogs() {
    try {
      if (fs.existsSync(this.logPath)) {
        fs.writeFileSync(this.logPath, '');
      }
    } catch (error) {
      console.error('Error clearing log file:', error);
    }
  }

  exportLogs(format = 'json') {
    const logs = this.getLogs();
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else if (format === 'csv') {
      if (logs.length === 0) {
        return '';
      }
      
      const headers = Object.keys(logs[0]).join(',');
      const rows = logs.map(log => Object.values(log).join(','));
      return [headers, ...rows].join('\n');
    }
    
    return JSON.stringify(logs, null, 2);
  }
}

module.exports = UsageDb;
