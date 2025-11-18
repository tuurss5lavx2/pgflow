const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authenticateToken = require('../middleware/auth');
const { postCreationLimiter } = require('../middleware/rateLimit');

// Rotas públicas
router.get('/', postController.getAll);
router.get('/:id', postController.getById);
router.get('/category/:categoryId', postController.getByCategory);
router.get('/search/:query', postController.search);

// Rotas protegidas
router.use(authenticateToken);

router.post('/', postCreationLimiter, postController.create);
router.get('/user/posts', postController.getByUser);
router.put('/:id', postController.update);
router.delete('/:id', postController.delete);

module.exports = router;