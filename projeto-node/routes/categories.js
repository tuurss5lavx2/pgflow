const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Rotas públicas para categorias
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao carregar categorias' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao carregar categoria' });
  }
});

module.exports = router;