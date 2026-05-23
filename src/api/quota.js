const express = require('express');
const QuotaTracker = require('../core/quota/quotaTracker');
const UsageDb = require('../lib/usageDb');

const router = express.Router();
const usageDb = new UsageDb();
const quotaTracker = new QuotaTracker(usageDb);

// GET /api/quota - Get all quota status
router.get('/', (req, res) => {
  try {
    const status = quotaTracker.getQuotaStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/quota/:provider - Get quota for specific provider
router.get('/:provider', (req, res) => {
  try {
    const quota = quotaTracker.getProviderQuota(req.params.provider);
    
    if (!quota) {
      return res.status(404).json({ success: false, error: 'Provider quota not found' });
    }
    
    res.json({ success: true, data: quota });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/quota/:provider - Set quota for provider
router.post('/:provider', (req, res) => {
  try {
    const { maxTokens, resetAt } = req.body;
    
    if (!maxTokens || !resetAt) {
      return res.status(400).json({ 
        success: false, 
        error: 'maxTokens and resetAt are required' 
      });
    }
    
    quotaTracker.setProviderQuota(req.params.provider, maxTokens, resetAt);
    
    res.json({ success: true, message: 'Quota set successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/quota/monthly - Get monthly report
router.get('/monthly/:month?', (req, res) => {
  try {
    const { month } = req.params;
    const report = quotaTracker.getMonthlyReport(month);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/quota/monthly/all - Get all monthly reports
router.get('/monthly/all', (req, res) => {
  try {
    const reports = quotaTracker.getAllMonthlyReports();
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/quota/pricing - Get all pricing
router.get('/pricing', (req, res) => {
  try {
    const pricing = quotaTracker.getAllPricing();
    res.json({ success: true, data: pricing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/quota/pricing/:provider - Set pricing for provider
router.post('/pricing/:provider', (req, res) => {
  try {
    const { provider } = req.params;
    const { input, output, currency } = req.body;

    quotaTracker.setPricing(provider, { input, output, currency });
    
    res.json({ success: true, message: 'Pricing updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/quota/estimate - Estimate cost for request
router.post('/estimate', (req, res) => {
  try {
    const { provider, inputTokens, outputTokens } = req.body;

    const cost = quotaTracker.estimateCost(provider, inputTokens, outputTokens);
    
    res.json({ success: true, data: { cost, provider } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
