const express = require('express');
const UsageDb = require('../lib/usageDb');

const router = express.Router();
const usageDb = new UsageDb();

// GET /api/logs - Get logs
router.get('/', (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const logs = usageDb.getLogs(parseInt(limit));
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/logs/export - Export logs
router.get('/export', (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const data = usageDb.exportLogs(format);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=logs.csv');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=logs.json');
    }
    
    res.send(data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/logs - Clear logs
router.delete('/', (req, res) => {
  try {
    usageDb.clearLogs();
    res.json({ success: true, message: 'Logs cleared' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
