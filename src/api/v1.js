const express = require('express');
const RoutingEngine = require('../core/routing/routingEngine');

const router = express.Router();
const routingEngine = new RoutingEngine();

// POST /v1/chat/completions - OpenAI-compatible chat completions
router.post('/chat/completions', async (req, res) => {
  try {
    const result = await routingEngine.route(req.body);

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({
        error: {
          message: result.error,
          type: 'api_error',
          code: 'internal_error'
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      error: {
        message: error.message,
        type: 'api_error',
        code: 'internal_error'
      }
    });
  }
});

// POST /v1/messages - Anthropic-compatible messages
router.post('/messages', async (req, res) => {
  try {
    // Convert Anthropic format to internal format
    const internalRequest = {
      model: req.body.model,
      messages: req.body.messages,
      max_tokens: req.body.max_tokens,
      temperature: req.body.temperature,
      stream: req.body.stream
    };

    const result = await routingEngine.route(internalRequest);

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({
        error: {
          message: result.error,
          type: 'api_error'
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      error: {
        message: error.message,
        type: 'api_error'
      }
    });
  }
});

// GET /v1/models - List available models
router.get('/models', (req, res) => {
  try {
    const models = [
      {
        id: 'openai/gpt-4',
        object: 'model',
        created: Date.now(),
        owned_by: 'openai'
      },
      {
        id: 'anthropic/claude-3-opus-20240229',
        object: 'model',
        created: Date.now(),
        owned_by: 'anthropic'
      },
      {
        id: 'deepseek/deepseek-chat',
        object: 'model',
        created: Date.now(),
        owned_by: 'deepseek'
      },
      {
        id: 'groq/llama3-70b-8192',
        object: 'model',
        created: Date.now(),
        owned_by: 'groq'
      }
    ];

    res.json({
      object: 'list',
      data: models
    });
  } catch (error) {
    res.status(500).json({
      error: {
        message: error.message
      }
    });
  }
});

module.exports = router;
