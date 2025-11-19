const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authenticateToken = require('../middleware/auth');

// Todas as rotas exigem autenticação
router.use(authenticateToken);

router.post('/', postController.create);
router.get('/', postController.getAll);
router.get('/user', postController.getByUser);
router.get('/:id', postController.getById);
router.put('/:id', postController.update);
router.delete('/:id', postController.delete);
router.post('/:id/like', postController.like); // ✅ APENAS UMA ROTA

module.exports = router;