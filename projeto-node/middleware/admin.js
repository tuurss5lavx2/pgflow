const User = require('./models/User');

const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Acesso negado. Apenas administradores podem acessar este recurso.' 
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao verificar permissões' });
  }
};

module.exports = requireAdmin;