/**
 * Golden Router OAuth Token Refresh System
 * Automatically refreshes OAuth tokens before expiration
 * Supports Claude, Codex, Gemini, and other OAuth providers
 */

class OAuthManager {
  constructor(localDb) {
    this.localDb = localDb;
    this.refreshIntervals = new Map();
  }

  /**
   * Start auto-refresh for a provider connection
   */
  startAutoRefresh(connectionId) {
    const connection = this.localDb.getProviderConnection(connectionId);
    if (!connection || connection.type !== 'oauth') {
      return;
    }

    // Clear existing interval if any
    this.stopAutoRefresh(connectionId);

    // Calculate refresh interval (5 minutes before expiration)
    const expiresAt = new Date(connection.credentials.expiresAt);
    const now = new Date();
    const timeUntilExpiry = expiresAt - now;
    const refreshInterval = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60 * 1000); // At least 1 minute

    // Set up refresh interval
    const intervalId = setInterval(async () => {
      await this.refreshToken(connectionId);
    }, refreshInterval);

    this.refreshIntervals.set(connectionId, intervalId);
  }

  /**
   * Stop auto-refresh for a provider connection
   */
  stopAutoRefresh(connectionId) {
    const intervalId = this.refreshIntervals.get(connectionId);
    if (intervalId) {
      clearInterval(intervalId);
      this.refreshIntervals.delete(connectionId);
    }
  }

  /**
   * Refresh OAuth token
   */
  async refreshToken(connectionId) {
    const connection = this.localDb.getProviderConnection(connectionId);
    if (!connection || connection.type !== 'oauth') {
      throw new Error('Invalid OAuth connection');
    }

    const { provider, credentials } = connection;

    try {
      let newCredentials;

      switch (provider) {
        case 'claude-pro':
          newCredentials = await this.refreshClaudeToken(credentials);
          break;
        case 'codex':
          newCredentials = await this.refreshCodexToken(credentials);
          break;
        case 'gemini':
          newCredentials = await this.refreshGeminiToken(credentials);
          break;
        default:
          throw new Error(`Unsupported OAuth provider: ${provider}`);
      }

      // Update credentials in database
      this.localDb.updateProviderConnection(connectionId, {
        credentials: newCredentials,
        lastTested: new Date().toISOString()
      });

      console.log(`Token refreshed for ${provider} (${connectionId})`);
      return newCredentials;
    } catch (error) {
      console.error(`Failed to refresh token for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Refresh Claude (Anthropic) OAuth token
   */
  async refreshClaudeToken(credentials) {
    // Placeholder - implement actual Claude OAuth refresh
    // This would call Anthropic's OAuth refresh endpoint
    
    // Simulate refresh
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

    return {
      accessToken: credentials.accessToken, // In real implementation, get new token
      refreshToken: credentials.refreshToken,
      expiresAt: expiresAt.toISOString()
    };
  }

  /**
   * Refresh Codex (OpenAI) OAuth token
   */
  async refreshCodexToken(credentials) {
    // Placeholder - implement actual Codex OAuth refresh
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

    return {
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
      expiresAt: expiresAt.toISOString()
    };
  }

  /**
   * Refresh Gemini OAuth token
   */
  async refreshGeminiToken(credentials) {
    // Placeholder - implement actual Gemini OAuth refresh
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

    return {
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
      expiresAt: expiresAt.toISOString()
    };
  }

  /**
   * Check if token needs refresh
   */
  needsRefresh(connection) {
    if (connection.type !== 'oauth') {
      return false;
    }

    const expiresAt = new Date(connection.credentials.expiresAt);
    const now = new Date();
    const timeUntilExpiry = expiresAt - now;

    // Refresh if less than 5 minutes until expiry
    return timeUntilExpiry < 5 * 60 * 1000;
  }

  /**
   * Validate token
   */
  async validateToken(connectionId) {
    const connection = this.localDb.getProviderConnection(connectionId);
    if (!connection) {
      return { valid: false, error: 'Connection not found' };
    }

    if (this.needsRefresh(connection)) {
      try {
        await this.refreshToken(connectionId);
        return { valid: true, refreshed: true };
      } catch (error) {
        return { valid: false, error: error.message };
      }
    }

    return { valid: true, refreshed: false };
  }

  /**
   * Stop all auto-refresh intervals
   */
  stopAllAutoRefresh() {
    for (const [connectionId, intervalId] of this.refreshIntervals) {
      clearInterval(intervalId);
    }
    this.refreshIntervals.clear();
  }
}

module.exports = OAuthManager;
