const express = require('express');
const OAuthOnboarding = require('../core/oauth/oauthOnboarding');
const OAuthManager = require('../core/oauth/oauthManager');
const LocalDb = require('../lib/localDb');

const router = express.Router();
const localDb = new LocalDb();
const oauthOnboarding = new OAuthOnboarding(localDb);
const oauthManager = new OAuthManager(localDb);

// POST /api/oauth/:provider/authorize - Start OAuth flow
router.post('/:provider/authorize', async (req, res) => {
  try {
    const { provider } = req.params;
    const { redirectUri } = req.body;

    const authData = await oauthOnboarding.startAuthorization(provider, redirectUri);
    
    res.json({ success: true, data: authData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/oauth/:provider/exchange - Exchange code for tokens
router.post('/:provider/exchange', async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, state, redirectUri, name } = req.body;

    const tokens = await oauthOnboarding.exchangeCodeForTokens(provider, code, state, redirectUri);
    const connection = await oauthOnboarding.createConnection(provider, tokens, name);
    
    // Start auto-refresh for this connection
    oauthManager.startAutoRefresh(connection.id);
    
    res.status(201).json({ success: true, data: connection });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/oauth/:connectionId/refresh - Manually refresh token
router.post('/:connectionId/refresh', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const credentials = await oauthManager.refreshToken(connectionId);
    
    res.json({ success: true, data: credentials });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/oauth/:connectionId/validate - Validate token
router.post('/:connectionId/validate', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const validation = await oauthManager.validateToken(connectionId);
    
    res.json({ success: true, data: validation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
