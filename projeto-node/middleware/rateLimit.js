/*const rateLimit = require('express-rate-limit');

// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas por IP
  message: {
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting para criação de posts
const postCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 10 posts por hora
  message: {
    message: 'Limite de criação de posts excedido. Tente novamente em 1 hora.'
  }
});

// Rate limiting para comentários
const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // máximo 20 comentários por 15 minutos
  message: {
    message: 'Muitos comentários em um curto período. Tente novamente em 15 minutos.'
  }
});
*/
module.exports = {
  loginLimiter,
  postCreationLimiter,
  commentLimiter
};