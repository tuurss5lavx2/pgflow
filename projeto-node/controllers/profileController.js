const User = require('./models/User');
const UserProfile = require('../models/UserProfile');
const Post = require('./models/Post');
const Activity = require('../models/Activity');
const { deleteFile, fileExists } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

class ProfileController {
  constructor() {
    this.defaultAvatar = '/images/default-avatar.png';
  }

  // Obter perfil completo do usuário atual
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      console.log(`📋 Buscando perfil do usuário: ${userId}`);
      
      // Buscar usuário com todos os dados
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: 'Usuário não encontrado' 
        });
      }
      
      // Buscar ou criar perfil
      let profile = await UserProfile.findOne({ user: userId })
        .populate('user', 'name email role createdAt lastLogin');
      
      if (!profile) {
        console.log(`🆕 Criando novo perfil para usuário: ${userId}`);
        
        profile = await UserProfile.create({
          user: userId,
          displayName: user.name,
          avatar: {
            url: this.defaultAvatar,
            filename: null
          }
        });
        
        await profile.populate('user', 'name email role createdAt lastLogin');
        
        // Log da criação do perfil
        await Activity.create({
          user: userId,
          action: 'create_profile',
          description: 'Perfil criado automaticamente'
        });
      }
      
      // Buscar estatísticas do usuário
      const userStats = await this.getUserStats(userId);
      
      res.json({
        success: true,
        data: {
          user: user.getPublicProfile(),
          profile: profile.toObject(),
          stats: userStats
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar perfil:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro interno ao carregar perfil',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Atualizar perfil com validação completa
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { displayName, bio, website, location } = req.body;
      
      console.log(`✏️ Atualizando perfil do usuário: ${userId}`, {
        displayName, bio, website, location
      });
      
      // Validações
      const validationErrors = [];
      
      if (displayName && displayName.trim().length < 2) {
        validationErrors.push('Nome de exibição deve ter pelo menos 2 caracteres');
      }
      
      if (displayName && displayName.trim().length > 50) {
        validationErrors.push('Nome de exibição deve ter no máximo 50 caracteres');
      }
      
      if (bio && bio.length > 500) {
        validationErrors.push('Biografia deve ter no máximo 500 caracteres');
      }
      
      if (website && !this.isValidUrl(website)) {
        validationErrors.push('Website deve ser uma URL válida');
      }
      
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Dados de perfil inválidos',
          errors: validationErrors
        });
      }
      
      // Preparar dados para atualização
      const updateData = {};
      
      if (displayName !== undefined) {
        updateData.displayName = displayName.trim();
      }
      
      if (bio !== undefined) {
        updateData.bio = bio.trim();
      }
      
      if (website !== undefined) {
        updateData.website = website.trim() || null;
      }
      
      if (location !== undefined) {
        updateData.location = location.trim() || null;
      }
      
      // Atualizar perfil
      const profile = await UserProfile.findOneAndUpdate(
        { user: userId },
        updateData,
        { 
          new: true, 
          upsert: true,
          runValidators: true 
        }
      ).populate('user', 'name email');
      
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Perfil não encontrado'
        });
      }
      
      // Log da atividade
      await Activity.create({
        user: userId,
        action: 'update_profile',
        description: 'Perfil atualizado',
        details: `Campos atualizados: ${Object.keys(updateData).join(', ')}`
      });
      
      console.log(`✅ Perfil atualizado com sucesso: ${userId}`);
      
      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso!',
        data: {
          profile
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro interno ao atualizar perfil',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Upload de avatar com tratamento completo
  async uploadAvatar(req, res) {
    try {
      const userId = req.user.id;
      
      console.log(`📸 Processando upload de avatar para usuário: ${userId}`);
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Nenhuma imagem foi enviada'
        });
      }
      
      // Verificar se o arquivo foi salvo com sucesso
      if (!req.file.filename) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao processar o arquivo de imagem'
        });
      }
      
      console.log(`🖼️ Arquivo de avatar recebido:`, {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
      
      // Buscar perfil atual
      const currentProfile = await UserProfile.findOne({ user: userId });
      
      // Deletar avatar anterior se existir
      if (currentProfile && currentProfile.avatar && currentProfile.avatar.url !== this.defaultAvatar) {
        try {
          console.log(`🗑️ Deletando avatar anterior: ${currentProfile.avatar.url}`);
          await deleteFile(currentProfile.avatar.url);
        } catch (deleteError) {
          console.warn('⚠️ Não foi possível deletar avatar anterior:', deleteError.message);
          // Continuar mesmo se não conseguir deletar o anterior
        }
      }
      
      // Caminho relativo para salvar no banco
      const avatarRelativePath = `/uploads/avatars/${req.file.filename}`;
      
      console.log(`💾 Salvando novo avatar: ${avatarRelativePath}`);
      
      // Atualizar perfil com nova imagem
      const updatedProfile = await UserProfile.findOneAndUpdate(
        { user: userId },
        {
          avatar: {
            url: avatarRelativePath,
            filename: req.file.filename
          }
        },
        { 
          new: true, 
          upsert: true 
        }
      ).populate('user', 'name email');
      
      // Log da atividade
      await Activity.create({
        user: userId,
        action: 'update_avatar',
        description: 'Avatar atualizado',
        details: `Novo arquivo: ${req.file.filename}`
      });
      
      console.log(`✅ Avatar atualizado com sucesso para usuário: ${userId}`);
      
      res.json({
        success: true,
        message: 'Avatar atualizado com sucesso!',
        data: {
          profile: updatedProfile,
          avatarUrl: avatarRelativePath
        }
      });
      
    } catch (error) {
      console.error('❌ Erro no upload de avatar:', error);
      
      // Tentar deletar o arquivo que foi salvo em caso de erro
      if (req.file && req.file.filename) {
        try {
          const filePath = `/uploads/avatars/${req.file.filename}`;
          await deleteFile(filePath);
        } catch (cleanupError) {
          console.error('❌ Erro na limpeza do arquivo:', cleanupError);
        }
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Erro interno ao fazer upload do avatar',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Alterar senha com validações robustas
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword, confirmPassword } = req.body;
      
      console.log(`🔐 Processando alteração de senha para usuário: ${userId}`);
      
      // Validações completas
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos de senha são obrigatórios'
        });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'A nova senha deve ter pelo menos 8 caracteres'
        });
      }
      
      if (newPassword.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'A nova senha deve ter no máximo 100 caracteres'
        });
      }
      
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'A nova senha e a confirmação não coincidem'
        });
      }
      
      if (newPassword === currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'A nova senha deve ser diferente da senha atual'
        });
      }
      
      // Buscar usuário
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      // Verificar senha atual
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual incorreta'
        });
      }
      
      // Atualizar senha
      user.password = newPassword;
      await user.save();
      
      // Log da atividade
      await Activity.create({
        user: userId,
        action: 'change_password',
        description: 'Senha alterada com sucesso'
      });
      
      console.log(`✅ Senha alterada com sucesso para usuário: ${userId}`);
      
      res.json({
        success: true,
        message: 'Senha alterada com sucesso!'
      });
      
    } catch (error) {
      console.error('❌ Erro ao alterar senha:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro interno ao alterar senha',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obter perfil público completo
  async getPublicProfile(req, res) {
    try {
      const userId = req.params.userId;
      
      console.log(`👤 Buscando perfil público do usuário: ${userId}`);
      
      // Buscar usuário
      const user = await User.findById(userId).select('name email role createdAt lastLogin');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      // Buscar perfil
      const profile = await UserProfile.findOne({ user: userId })
        .select('displayName bio avatar website location');
      
      // Buscar estatísticas públicas
      const publicStats = await this.getPublicUserStats(userId);
      
      // Buscar posts públicos recentes
      const recentPosts = await Post.find({ 
        author: userId, 
        isPublished: true 
      })
      .select('title excerpt likeCount commentCount viewCount createdAt')
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('categories', 'name color');
      
      console.log(`✅ Perfil público carregado: ${user.name}`);
      
      res.json({
        success: true,
        data: {
          user: {
            _id: user._id,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
          },
          profile: profile || {
            displayName: user.name,
            avatar: { url: this.defaultAvatar }
          },
          stats: publicStats,
          recentPosts
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar perfil público:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro interno ao carregar perfil',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Métodos auxiliares
  async getUserStats(userId) {
    try {
      const [
        postCount,
        totalLikes,
        totalComments,
        recentActivity
      ] = await Promise.all([
        Post.countDocuments({ author: userId, isPublished: true }),
        Post.aggregate([
          { $match: { author: userId, isPublished: true } },
          { $group: { _id: null, total: { $sum: '$likeCount' } } }
        ]),
        Post.aggregate([
          { $match: { author: userId, isPublished: true } },
          { $group: { _id: null, total: { $sum: '$commentCount' } } }
        ]),
        Activity.find({ user: userId })
          .sort({ createdAt: -1 })
          .limit(5)
      ]);
      
      return {
        posts: postCount,
        likes: totalLikes[0]?.total || 0,
        comments: totalComments[0]?.total || 0,
        recentActivity
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return { posts: 0, likes: 0, comments: 0, recentActivity: [] };
    }
  }

  async getPublicUserStats(userId) {
    try {
      const [
        postCount,
        totalLikes
      ] = await Promise.all([
        Post.countDocuments({ author: userId, isPublished: true }),
        Post.aggregate([
          { $match: { author: userId, isPublished: true } },
          { $group: { _id: null, total: { $sum: '$likeCount' } } }
        ])
      ]);
      
      return {
        posts: postCount,
        likes: totalLikes[0]?.total || 0
      };
    } catch (error) {
      return { posts: 0, likes: 0 };
    }
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
}

// Exportar instância do controller
module.exports = new ProfileController();