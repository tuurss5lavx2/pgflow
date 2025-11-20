const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');
const upload = require('../middleware/upload'); // ← ESTÁ CORRETO AGORA

// Rotas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rotas protegidas
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.post('/avatar', authenticateToken, upload.single('avatar'), authController.uploadAvatar);

module.exports = router;