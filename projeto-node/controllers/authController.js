const User = require('../models/user');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
const { uploadToCloudinary } = require('../middleware/upload');
const upload = require('../middleware/upload');
const uploadToCloudinary = upload.uploadToCloudinary;

const authController = {
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
      }
      
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: 'Email já cadastrado' });
      }
      
      const user = await User.create({ name, email, password });
      
      res.status(201).json({ 
        message: 'Usuário criado com sucesso',
        userId: user._id 
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao criar usuário' });
    }
  },
  
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
      }
      
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
      
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
      
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({
        message: 'Login realizado com sucesso',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  uploadAvatar: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhuma imagem enviada' });
      }

      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      // Se já tem avatar no Cloudinary, deleta o antigo
      if (user.avatar && user.avatar.includes('res.cloudinary.com')) {
        try {
          const urlParts = user.avatar.split('/');
          const publicIdWithExtension = urlParts[urlParts.length - 1];
          const publicId = publicIdWithExtension.split('.')[0];
          const fullPublicId = `pgflow-avatars/${publicId}`;
          
          await cloudinary.uploader.destroy(fullPublicId);
        } catch (error) {
          console.log('Erro ao deletar avatar antigo:', error);
        }
      }

      // Faz upload para o Cloudinary
      const result = await uploadToCloudinary(req.file.buffer, userId);
      
      // Atualiza avatar no usuário com URL do Cloudinary
      user.avatar = result.secure_url;
      await user.save();

      res.json({
        message: 'Avatar atualizado com sucesso!',
        avatar: user.avatar,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      });

    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      res.status(500).json({ message: 'Erro interno ao fazer upload' });
    }
  },

  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      res.status(500).json({ message: 'Erro interno ao buscar perfil' });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, email } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(409).json({ message: 'Email já está em uso' });
        }
        user.email = email;
      }

      if (name) user.name = name;
      await user.save();

      res.json({
        message: 'Perfil atualizado com sucesso!',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      });

    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      res.status(500).json({ message: 'Erro interno ao atualizar perfil' });
    }
  }
};

module.exports = authController;