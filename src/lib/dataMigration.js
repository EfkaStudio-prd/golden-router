const fs = require('fs');
const path = require('path');

/**
 * Golden Router Data Migration System
 * Handles schema migrations and data upgrades
 */

class DataMigration {
  constructor(dataDir = null) {
    this.dataDir = dataDir || process.env.DATA_DIR || path.join(require('os').homedir(), '.golden-router');
    this.dbPath = path.join(this.dataDir, 'db.json');
    this.migrationPath = path.join(this.dataDir, '.migration-version');
    this.currentVersion = this.getCurrentVersion();
    this.targetVersion = '2.0.0';
  }

  /**
   * Get current migration version
   */
  getCurrentVersion() {
    if (fs.existsSync(this.migrationPath)) {
      return fs.readFileSync(this.migrationPath, 'utf-8').trim();
    }
    return '1.0.0';
  }

  /**
   * Set migration version
   */
  setMigrationVersion(version) {
    fs.writeFileSync(this.migrationPath, version);
    this.currentVersion = version;
  }

  /**
   * Check if migration is needed
   */
  needsMigration() {
    return this.currentVersion !== this.targetVersion;
  }

  /**
   * Run migrations
   */
  async migrate() {
    if (!this.needsMigration()) {
      return { migrated: false, currentVersion: this.currentVersion };
    }

    console.log(`Migrating from ${this.currentVersion} to ${this.targetVersion}`);

    // Backup current data
    await this.backup();

    try {
      // Run migration steps
      await this.migrateTo200();

      // Update version
      this.setMigrationVersion(this.targetVersion);

      return { 
        migrated: true, 
        from: this.currentVersion, 
        to: this.targetVersion 
      };
    } catch (error) {
      console.error('Migration failed:', error);
      // Rollback from backup
      await this.rollback();
      throw error;
    }
  }

  /**
   * Backup current data
   */
  async backup() {
    if (fs.existsSync(this.dbPath)) {
      const backupPath = path.join(this.dataDir, `db.backup.${Date.now()}.json`);
      fs.copyFileSync(this.dbPath, backupPath);
      console.log(`Backup created: ${backupPath}`);
    }
  }

  /**
   * Rollback from backup
   */
  async rollback() {
    const backupFiles = fs.readdirSync(this.dataDir)
      .filter(f => f.startsWith('db.backup.') && f.endsWith('.json'))
      .sort()
      .reverse();

    if (backupFiles.length > 0) {
      const latestBackup = backupFiles[0];
      const backupPath = path.join(this.dataDir, latestBackup);
      fs.copyFileSync(backupPath, this.dbPath);
      console.log(`Rolled back from: ${backupPath}`);
    }
  }

  /**
   * Migrate to version 2.0.0
   */
  async migrateTo200() {
    if (!fs.existsSync(this.dbPath)) {
      // No existing data, create fresh
      return;
    }

    const data = JSON.parse(fs.readFileSync(this.dbPath, 'utf-8'));

    // Add new fields if they don't exist
    if (!data.accounts) {
      data.accounts = [];
    }

    if (!data.pricing) {
      data.pricing = {};
    }

    // Update settings with new defaults
    if (!data.settings) {
      data.settings = {
        rtkEnabled: true,
        cavemanEnabled: true,
        cloudSyncEnabled: false,
        logLevel: 'info'
      };
    } else {
      // Add new setting fields
      if (data.settings.cloudSyncEnabled === undefined) {
        data.settings.cloudSyncEnabled = false;
      }
    }

    // Save migrated data
    fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
  }

  /**
   * Get migration status
   */
  getStatus() {
    return {
      currentVersion: this.currentVersion,
      targetVersion: this.targetVersion,
      needsMigration: this.needsMigration()
    };
  }
}

module.exports = DataMigration;
