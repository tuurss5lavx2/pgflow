const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authenticateToken = require('../middleware/auth');
const { commentLimiter } = require('../middleware/rateLimit');

// Todas as rotas exigem autenticação
router.use(authenticateToken);

// Aplicar rate limiting apenas para criação de comentários
router.post('/', commentLimiter, commentController.createComment);
router.get('/post/:postId', commentController.getPostComments);
router.put('/:id', commentController.updateComment);
router.delete('/:id', commentController.deleteComment);
router.post('/:id/like', commentController.toggleLike);

module.exports = router;