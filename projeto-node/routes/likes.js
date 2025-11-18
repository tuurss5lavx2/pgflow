const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');
const authenticateToken = require('../middleware/auth');

// Todas as rotas exigem autenticação
router.use(authenticateToken);

// Rotas de likes
router.post('/post/:postId/toggle', likeController.togglePostLike);
router.get('/post/:postId/check', likeController.checkPostLike);
router.get('/posts', likeController.getLikedPosts);

module.exports = router;