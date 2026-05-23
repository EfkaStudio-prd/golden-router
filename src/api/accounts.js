const express = require('express');
const LocalDb = require('../lib/localDb');

const router = express.Router();
const localDb = new LocalDb();

// GET /api/accounts - List all accounts (optionally filtered by provider)
router.get('/', (req, res) => {
  try {
    const { provider } = req.query;
    const accounts = localDb.getAccounts(provider);
    res.json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/accounts/:id - Get account by ID
router.get('/:id', (req, res) => {
  try {
    const accounts = localDb.getAccounts();
    const account = accounts.find(a => a.id === req.params.id);
    
    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }
    
    res.json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/accounts - Create new account
router.post('/', (req, res) => {
  try {
    const { provider, apiKey, priority = 1, maxTokens, resetAt } = req.body;
    
    if (!provider || !apiKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'Provider and apiKey are required' 
      });
    }

    const account = localDb.addAccount({
      provider,
      apiKey,
      priority,
      maxTokens,
      resetAt
    });
    
    res.status(201).json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/accounts/:id - Update account
router.put('/:id', (req, res) => {
  try {
    const account = localDb.updateAccount(req.params.id, req.body);
    
    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }
    
    res.json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/accounts/:id - Delete account
router.delete('/:id', (req, res) => {
  try {
    const accounts = localDb.getAccounts();
    const account = accounts.find(a => a.id === req.params.id);
    
    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }
    
    localDb.data.accounts = localDb.data.accounts.filter(a => a.id !== req.params.id);
    localDb.save();
    
    res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/accounts/:id/test - Test account availability
router.post('/:id/test', (req, res) => {
  try {
    const accounts = localDb.getAccounts();
    const account = accounts.find(a => a.id === req.params.id);
    
    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }
    
    const isAvailable = localDb.isAccountAvailable(account);
    
    res.json({ 
      success: true, 
      data: {
        id: account.id,
        provider: account.provider,
        status: account.status,
        isAvailable,
        cooldownUntil: account.cooldownUntil
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
