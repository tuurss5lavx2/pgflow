const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', postController.create);
router.get('/', postController.getAll);
router.get('/user', postController.getByUser); // ← Esta rota é importante
router.get('/:id', postController.getById);
router.put('/:id', postController.update);
router.delete('/:id', postController.delete);

router.post('/:id/like', authenticateToken, postController.like);
router.post('/:id/unlike', authenticateToken, postController.unlike);

module.exports = router;