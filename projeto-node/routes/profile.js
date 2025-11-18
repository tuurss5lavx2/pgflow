const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authenticateToken = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

// Todas as rotas exigem autenticação
router.use(authenticateToken);

// Rotas de perfil
router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.post('/avatar', uploadAvatar.single('avatar'), profileController.uploadAvatar);
router.put('/password', profileController.changePassword);

// Rota pública (não precisa de auth)
router.get('/public/:userId', profileController.getPublicProfile);

module.exports = router;