const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Golden Router Cloud Sync
 * Syncs configuration across devices with encrypted storage
 */

class CloudSync {
  constructor(localDb, cloudUrl = null, encryptionKey = null) {
    this.localDb = localDb;
    this.cloudUrl = cloudUrl || process.env.CLOUD_URL;
    this.encryptionKey = encryptionKey || process.env.ENCRYPTION_KEY;
    this.machineId = this.getOrCreateMachineId();
    this.interval = null;
    this.syncEnabled = false;
  }

  /**
   * Get or create machine ID
   */
  getOrCreateMachineId() {
    const machineIdPath = path.join(this.localDb.dataDir, '.machine-id');
    
    if (fs.existsSync(machineIdPath)) {
      return fs.readFileSync(machineIdPath, 'utf-8').trim();
    }
    
    const machineId = 'machine-' + crypto.randomBytes(16).toString('hex');
    fs.writeFileSync(machineIdPath, machineId);
    return machineId;
  }

  /**
   * Enable cloud sync
   */
  async enable() {
    if (!this.cloudUrl) {
      throw new Error('Cloud URL not configured');
    }

    if (!this.encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    this.syncEnabled = true;
    this.localDb.updateSettings({ cloudSyncEnabled: true });

    // Initial sync
    await this.sync();

    // Start periodic sync (every 5 minutes)
    this.startPeriodicSync();

    return { enabled: true, machineId: this.machineId };
  }

  /**
   * Disable cloud sync
   */
  async disable() {
    this.syncEnabled = false;
    this.localDb.updateSettings({ cloudSyncEnabled: false });
    this.stopPeriodicSync();

    // Notify cloud to delete this machine's data
    if (this.cloudUrl) {
      try {
        await this.deleteFromCloud();
      } catch (error) {
        console.error('Failed to delete from cloud:', error);
      }
    }

    return { enabled: false };
  }

  /**
   * Start periodic sync
   */
  startPeriodicSync() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(async () => {
      try {
        await this.sync();
      } catch (error) {
        console.error('Periodic sync failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Sync with cloud
   */
  async sync() {
    if (!this.syncEnabled || !this.cloudUrl) {
      return;
    }

    try {
      // Get local data
      const localData = {
        providers: this.localDb.data.providerConnections,
        combos: this.localDb.data.combos,
        aliases: this.localDb.data.modelAliases,
        settings: this.localDb.data.settings,
        accounts: this.localDb.data.accounts,
        pricing: this.localDb.data.pricing
      };

      // Encrypt data
      const encryptedData = this.encrypt(JSON.stringify(localData));

      // Send to cloud
      const response = await fetch(`${this.cloudUrl}/sync/${this.machineId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Encryption-Version': '1.0'
        },
        body: JSON.stringify({ data: encryptedData }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Cloud sync failed: ${response.status}`);
      }

      const cloudData = await response.json();

      // Decrypt cloud data
      if (cloudData.data) {
        const decryptedData = JSON.parse(this.decrypt(cloudData.data));
        
        // Merge remote data (take newer versions)
        await this.mergeRemoteData(decryptedData);
      }

      return { success: true, syncedAt: new Date().toISOString() };
    } catch (error) {
      console.error('Cloud sync error:', error);
      // Continue without sync - fail-fast behavior
      return { success: false, error: error.message };
    }
  }

  /**
   * Merge remote data with local data
   */
  async mergeRemoteData(remoteData) {
    // Merge providers
    for (const remoteProvider of remoteData.providers || []) {
      const localProvider = this.localDb.data.providerConnections.find(
        p => p.id === remoteProvider.id
      );

      if (!localProvider || new Date(remoteProvider.updatedAt) > new Date(localProvider.updatedAt)) {
        // Add or update
        const index = this.localDb.data.providerConnections.findIndex(
          p => p.id === remoteProvider.id
        );
        
        if (index !== -1) {
          this.localDb.data.providerConnections[index] = remoteProvider;
        } else {
          this.localDb.data.providerConnections.push(remoteProvider);
        }
      }
    }

    // Similar logic for combos, aliases, accounts, settings, pricing
    this.mergeEntity('combos', remoteData.combos);
    this.mergeEntity('modelAliases', remoteData.aliases);
    this.mergeEntity('accounts', remoteData.accounts);
    
    // Merge settings (always take remote)
    if (remoteData.settings) {
      this.localDb.data.settings = { ...this.localDb.data.settings, ...remoteData.settings };
    }

    // Merge pricing
    if (remoteData.pricing) {
      this.localDb.data.pricing = { ...this.localDb.data.pricing, ...remoteData.pricing };
    }

    this.localDb.save();
  }

  /**
   * Merge entity array
   */
  mergeEntity(entityName, remoteEntities) {
    if (!remoteEntities) return;

    for (const remoteEntity of remoteEntities) {
      const localEntities = this.localDb.data[entityName];
      const localEntity = localEntities.find(e => e.id === remoteEntity.id);

      if (!localEntity || new Date(remoteEntity.updatedAt) > new Date(localEntity.updatedAt)) {
        const index = localEntities.findIndex(e => e.id === remoteEntity.id);
        
        if (index !== -1) {
          localEntities[index] = remoteEntity;
        } else {
          localEntities.push(remoteEntity);
        }
      }
    }
  }

  /**
   * Delete data from cloud
   */
  async deleteFromCloud() {
    const response = await fetch(`${this.cloudUrl}/sync/${this.machineId}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Failed to delete from cloud: ${response.status}`);
    }
  }

  /**
   * Encrypt data
   */
  encrypt(data) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const decipher = crypto.createDecipheriv(
      algorithm,
      key,
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      enabled: this.syncEnabled,
      machineId: this.machineId,
      cloudUrl: this.cloudUrl,
      hasEncryptionKey: !!this.encryptionKey
    };
  }
}

module.exports = CloudSync;
