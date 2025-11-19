const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authenticateToken = require('../middleware/auth');

// Todas as rotas exigem autenticação
router.use(authenticateToken);

router.post('/', commentController.create);
router.get('/post/:postId', commentController.getByPost);
router.delete('/:id', commentController.delete);
router.post('/:id/like', commentController.like);

module.exports = router;