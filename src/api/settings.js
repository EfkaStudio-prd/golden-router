const express = require('express');
const LocalDb = require('../lib/localDb');

const router = express.Router();
const localDb = new LocalDb();

// GET /api/settings - Get current settings
router.get('/', (req, res) => {
  try {
    const settings = localDb.data.settings;
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/settings - Update settings
router.put('/', (req, res) => {
  try {
    const updates = req.body;
    
    // Update settings
    localDb.data.settings = {
      ...localDb.data.settings,
      ...updates
    };
    
    localDb.save();
    
    res.json({ success: true, data: localDb.data.settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
