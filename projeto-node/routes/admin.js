const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateToken = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');

// Todas as rotas exigem autenticação e privilégios de admin
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard e estatísticas
router.get('/stats', adminController.getStats);

// Gerenciamento de usuários
router.get('/users', adminController.getUsers);
router.put('/users/:userId', adminController.updateUser);

// Gerenciamento de posts
router.get('/posts', adminController.getPosts);
router.put('/posts/:postId', adminController.updatePost);
router.delete('/posts/:postId', adminController.deletePost);

// Gerenciamento de categorias
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:categoryId', adminController.updateCategory);
router.delete('/categories/:categoryId', adminController.deleteCategory);

module.exports = router;