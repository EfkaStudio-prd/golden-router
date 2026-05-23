const express = require('express');
const ComboHandler = require('../core/combo/comboHandler');
const LocalDb = require('../lib/localDb');

const router = express.Router();
const localDb = new LocalDb();
const comboHandler = new ComboHandler(localDb);

// GET /api/combos - List all combos
router.get('/', (req, res) => {
  try {
    const combos = comboHandler.getAllCombos();
    res.json({ success: true, data: combos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/combos/:id - Get combo by ID
router.get('/:id', (req, res) => {
  try {
    const combo = comboHandler.getComboById(req.params.id);
    if (!combo) {
      return res.status(404).json({ success: false, error: 'Combo not found' });
    }
    res.json({ success: true, data: combo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/combos - Create new combo
router.post('/', (req, res) => {
  try {
    const { name, models, fallbackStrategy } = req.body;
    
    if (!name || !models || !Array.isArray(models) || models.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and models array are required' 
      });
    }

    // Validate each model has required fields
    for (const model of models) {
      if (!model.provider || !model.model || model.priority === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'Each model must have provider, model, and priority' 
        });
      }
    }

    const combo = comboHandler.createCombo({ name, models, fallbackStrategy });
    res.status(201).json({ success: true, data: combo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/combos/:id - Update combo
router.put('/:id', (req, res) => {
  try {
    const combo = comboHandler.updateCombo(req.params.id, req.body);
    if (!combo) {
      return res.status(404).json({ success: false, error: 'Combo not found' });
    }
    res.json({ success: true, data: combo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/combos/:id - Delete combo
router.delete('/:id', (req, res) => {
  try {
    comboHandler.deleteCombo(req.params.id);
    res.json({ success: true, message: 'Combo deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
