const express = require('express');
const CloudSync = require('../lib/cloudSync');
const LocalDb = require('../lib/localDb');

const router = express.Router();
const localDb = new LocalDb();

// POST /api/sync/enable - Enable cloud sync
router.post('/enable', async (req, res) => {
  try {
    const { cloudUrl, encryptionKey } = req.body;

    const cloudSync = new CloudSync(localDb, cloudUrl, encryptionKey);
    const result = await cloudSync.enable();

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/sync/disable - Disable cloud sync
router.post('/disable', async (req, res) => {
  try {
    const cloudSync = new CloudSync(localDb);
    const result = await cloudSync.disable();

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/sync/now - Force sync now
router.post('/now', async (req, res) => {
  try {
    const cloudSync = new CloudSync(localDb);
    const result = await cloudSync.sync();

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/sync/status - Get sync status
router.get('/status', (req, res) => {
  try {
    const cloudSync = new CloudSync(localDb);
    const status = cloudSync.getStatus();

    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
