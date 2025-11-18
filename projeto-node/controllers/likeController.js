const Like = require('./models/Like');
const Post = require('./models/Post');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const UserProfile = require('../models/UserProfile');

class LikeController {
  constructor() {
    this.likesPerPage = 15;
  }

  // Curtir/Descurtir post com tratamento completo
  async togglePostLike(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user.id;

      console.log(`❤️ Processando like no post: ${postId}`, { userId });

      // Verificar se o post existe e está publicado
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post não encontrado'
        });
      }

      if (!post.isPublished) {
        return res.status(404).json({
          success: false,
          message: 'Post não está disponível'
        });
      }

      // Verificar se já curtiu usando o modelo Like
      const existingLike = await Like.findOne({
        user: userId,
        post: postId
      });

      let action = '';
      let message = '';
      let hasLiked = false;

      if (existingLike) {
        // Remover like
        await Like.findByIdAndDelete(existingLike._id);
        
        // Atualizar contador no post
        post.likes.pull(userId);
        await post.save();
        
        action = 'unlike_post';
        message = 'Like removido!';
        hasLiked = false;

        console.log(`➖ Like removido do post: ${postId}`);
      } else {
        // Adicionar like
        await Like.create({
          user: userId,
          post: postId
        });
        
        // Atualizar contador no post
        post.likes.push(userId);
        await post.save();
        
        action = 'like_post';
        message = 'Post curtido!';
        hasLiked = true;

        // Log da atividade apenas para like (não para unlike)
        await Activity.create({
          user: userId,
          action: 'like_post',
          targetType: 'post',
          targetId: postId,
          description: `Curtiu o post: "${post.title.substring(0, 50)}..."`
        });

        console.log(`➕ Like adicionado ao post: ${postId}`);
      }

      // Buscar dados atualizados do post
      const updatedPost = await Post.findById(postId)
        .populate('author', 'name')
        .populate('categories', 'name color');

      res.json({
        success: true,
        message,
        data: {
          likes: updatedPost.likes.length,
          hasLiked,
          post: {
            _id: updatedPost._id,
            likeCount: updatedPost.likes.length
          }
        }
      });

    } catch (error) {
      console.error('❌ Erro ao processar like:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao processar like',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Verificar se usuário curtiu um post
  async checkPostLike(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user.id;

      console.log(`🔍 Verificando like no post: ${postId}`, { userId });

      const like = await Like.findOne({
        user: userId,
        post: postId
      });

      // Também verificar se o post existe
      const post = await Post.findById(postId);
      const postExists = !!post;

      res.json({
        success: true,
        data: {
          hasLiked: !!like,
          postExists,
          post: postExists ? {
            _id: post._id,
            title: post.title,
            likeCount: post.likes.length
          } : null
        }
      });

    } catch (error) {
      console.error('❌ Erro ao verificar like:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao verificar like',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obter posts curtidos pelo usuário com paginação
  async getLikedPosts(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || this.likesPerPage;
      const skip = (page - 1) * limit;

      console.log(`📋 Buscando posts curtidos do usuário: ${userId}`, { page, limit });

      // Buscar likes com populate avançado
      const likesQuery = Like.find({ user: userId })
        .populate({
          path: 'post',
          match: { isPublished: true }, // Apenas posts publicados
          populate: [
            { 
              path: 'author', 
              select: 'name',
              model: 'User'
            },
            { 
              path: 'categories', 
              select: 'name color',
              model: 'Category'
            }
          ]
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const likes = await likesQuery;

      // Filtrar posts que podem ter sido excluídos (match não funciona perfeitamente no populate)
      const validLikes = likes.filter(like => like.post !== null && like.post.isPublished);

      // Buscar avatares dos autores
      const authorIds = validLikes.map(like => like.post.author._id);
      const userProfiles = await UserProfile.find({
        user: { $in: authorIds }
      }).select('user avatar');

      const profileMap = new Map();
      userProfiles.forEach(profile => {
        profileMap.set(profile.user.toString(), profile);
      });

      // Formatar resposta com dados completos
      const likedPosts = validLikes.map(like => {
        const authorProfile = profileMap.get(like.post.author._id.toString());
        
        return {
          ...like.post.toObject(),
          author: {
            ...like.post.author.toObject(),
            avatar: authorProfile?.avatar || { url: '/images/default-avatar.png' }
          },
          likedAt: like.createdAt,
          likeId: like._id
        };
      });

      // Total de likes (apenas para posts válidos)
      const totalLikes = await Like.countDocuments({ 
        user: userId 
      });

      // Contar apenas posts válidos para paginação
      const totalValidLikes = validLikes.length;
      const totalPages = Math.ceil(totalLikes / limit);

      console.log(`✅ Posts curtidos carregados: ${likedPosts.length} de ${totalLikes}`);

      res.json({
        success: true,
        data: {
          posts: likedPosts,
          pagination: {
            current: page,
            pages: totalPages,
            total: totalLikes,
            validCount: totalValidLikes,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('❌ Erro ao carregar posts curtidos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao carregar posts curtidos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obter usuários que curtiram um post
  async getPostLikes(req, res) {
    try {
      const { postId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      console.log(`👥 Buscando usuários que curtiram o post: ${postId}`, { page, limit });

      // Verificar se o post existe
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post não encontrado'
        });
      }

      // Buscar likes com informações dos usuários
      const likes = await Like.find({ post: postId })
        .populate('user', 'name email createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Buscar perfis dos usuários para avatares
      const userIds = likes.map(like => like.user._id);
      const userProfiles = await UserProfile.find({
        user: { $in: userIds }
      }).select('user avatar displayName');

      const profileMap = new Map();
      userProfiles.forEach(profile => {
        profileMap.set(profile.user.toString(), profile);
      });

      // Formatar resposta
      const likers = likes.map(like => {
        const userProfile = profileMap.get(like.user._id.toString());
        
        return {
          user: {
            _id: like.user._id,
            name: like.user.name,
            displayName: userProfile?.displayName || like.user.name,
            avatar: userProfile?.avatar || { url: '/images/default-avatar.png' },
            memberSince: like.user.createdAt
          },
          likedAt: like.createdAt
        };
      });

      // Total de likes
      const totalLikes = await Like.countDocuments({ post: postId });
      const totalPages = Math.ceil(totalLikes / limit);

      console.log(`✅ Usuários que curtiram carregados: ${likers.length} de ${totalLikes}`);

      res.json({
        success: true,
        data: {
          likers,
          post: {
            _id: post._id,
            title: post.title,
            totalLikes
          },
          pagination: {
            current: page,
            pages: totalPages,
            total: totalLikes,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('❌ Erro ao carregar usuários que curtiram:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao carregar informações de likes',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Estatísticas de likes do usuário
  async getUserLikeStats(req, res) {
    try {
      const userId = req.user.id;

      console.log(`📊 Buscando estatísticas de likes do usuário: ${userId}`);

      const [
        totalLikesGiven,
        likedPostsCount,
        likedCommentsCount,
        recentLikes
      ] = await Promise.all([
        // Total de likes dados
        Like.countDocuments({ user: userId }),
        
        // Posts curtidos
        Like.countDocuments({ user: userId, post: { $exists: true } }),
        
        // Comentários curtidos
        Like.countDocuments({ user: userId, comment: { $exists: true } }),
        
        // Likes recentes (últimos 7 dias)
        Like.aggregate([
          {
            $match: {
              user: userId,
              createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

      res.json({
        success: true,
        data: {
          totalLikesGiven,
          likedPostsCount,
          likedCommentsCount,
          recentActivity: recentLikes,
          summary: {
            dailyAverage: (totalLikesGiven / 30).toFixed(1), // Média baseada em 30 dias
            postsPercentage: totalLikesGiven > 0 ? ((likedPostsCount / totalLikesGiven) * 100).toFixed(1) : 0,
            commentsPercentage: totalLikesGiven > 0 ? ((likedCommentsCount / totalLikesGiven) * 100).toFixed(1) : 0
          }
        }
      });

    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas de likes:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao carregar estatísticas',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

// Exportar instância do controller
module.exports = new LikeController();