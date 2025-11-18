const Comment = require('../models/Comment');
const Post = require('./models/Post');
const Activity = require('../models/Activity');
const User = require('./models/User');
const UserProfile = require('../models/UserProfile');

class CommentController {
  constructor() {
    this.commentsPerPage = 10;
    this.repliesPerComment = 5;
  }

  // Criar comentário com validação completa
  async createComment(req, res) {
    try {
      const { content, postId, parentCommentId } = req.body;
      const userId = req.user.id;
      
      console.log(`💬 Criando comentário:`, {
        userId,
        postId,
        parentCommentId,
        contentLength: content?.length
      });

      // Validações rigorosas
      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Conteúdo do comentário é obrigatório'
        });
      }

      if (content.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Comentário deve ter pelo menos 2 caracteres'
        });
      }

      if (content.trim().length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Comentário deve ter no máximo 1000 caracteres'
        });
      }

      if (!postId) {
        return res.status(400).json({
          success: false,
          message: 'ID do post é obrigatório'
        });
      }

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

      // Verificar se o comentário pai existe (para replies)
      let parentComment = null;
      if (parentCommentId) {
        parentComment = await Comment.findById(parentCommentId);
        if (!parentComment) {
          return res.status(404).json({
            success: false,
            message: 'Comentário pai não encontrado'
          });
        }

        // Verificar se o comentário pai pertence ao mesmo post
        if (parentComment.post.toString() !== postId) {
          return res.status(400).json({
            success: false,
            message: 'Comentário pai não pertence a este post'
          });
        }
      }

      // Buscar perfil do usuário para avatar
      const userProfile = await UserProfile.findOne({ user: userId });

      // Criar comentário
      const commentData = {
        content: content.trim(),
        author: userId,
        post: postId,
        parentComment: parentCommentId || null
      };

      const comment = await Comment.create(commentData);
      
      // Popular dados do autor
      await comment.populate('author', 'name');
      
      // Adicionar avatar ao objeto do comentário
      const commentWithAvatar = {
        ...comment.toObject(),
        author: {
          ...comment.author.toObject(),
          avatar: userProfile?.avatar || { url: '/images/default-avatar.png' }
        }
      };

      // Atualizar contador de comentários do post
      await Post.findByIdAndUpdate(postId, {
        $inc: { commentCount: 1 }
      });

      // Log da atividade
      await Activity.create({
        user: userId,
        action: 'comment_post',
        targetType: 'post',
        targetId: postId,
        description: parentCommentId 
          ? `Respondeu a um comentário no post: "${post.title.substring(0, 50)}..."`
          : `Comentou no post: "${post.title.substring(0, 50)}..."`
      });

      console.log(`✅ Comentário criado com sucesso: ${comment._id}`);

      res.status(201).json({
        success: true,
        message: parentCommentId ? 'Resposta criada com sucesso!' : 'Comentário criado com sucesso!',
        data: {
          comment: commentWithAvatar
        }
      });

    } catch (error) {
      console.error('❌ Erro ao criar comentário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao criar comentário',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obter comentários de um post com paginação avançada
  async getPostComments(req, res) {
    try {
      const { postId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || this.commentsPerPage;
      const skip = (page - 1) * limit;
      const includeReplies = req.query.includeReplies !== 'false';

      console.log(`📋 Buscando comentários do post: ${postId}`, {
        page, limit, includeReplies
      });

      // Verificar se o post existe
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post não encontrado'
        });
      }

      // Buscar comentários principais (sem parent) com populações
      const commentsQuery = Comment.find({ 
        post: postId,
        parentComment: null 
      })
      .populate('author', 'name')
      .populate({
        path: 'likes',
        select: 'name',
        options: { limit: 10 } // Limitar likes populados para performance
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

      const comments = await commentsQuery;
      
      // Buscar perfis dos autores para avatares
      const authorIds = comments.map(comment => comment.author._id);
      const userProfiles = await UserProfile.find({ 
        user: { $in: authorIds } 
      }).select('user avatar');

      const profileMap = new Map();
      userProfiles.forEach(profile => {
        profileMap.set(profile.user.toString(), profile);
      });

      // Processar comentários principais
      let commentsWithReplies = [];

      if (includeReplies) {
        // Buscar replies para cada comentário principal
        commentsWithReplies = await Promise.all(
          comments.map(async (comment) => {
            const authorProfile = profileMap.get(comment.author._id.toString());
            
            // Buscar replies limitadas
            const replies = await Comment.find({ parentComment: comment._id })
              .populate('author', 'name')
              .populate({
                path: 'likes',
                select: 'name',
                options: { limit: 5 }
              })
              .sort({ createdAt: 1 })
              .limit(this.repliesPerComment);

            // Buscar perfis dos autores das replies
            const replyAuthorIds = replies.map(reply => reply.author._id);
            const replyProfiles = await UserProfile.find({
              user: { $in: replyAuthorIds }
            }).select('user avatar');

            const replyProfileMap = new Map();
            replyProfiles.forEach(profile => {
              replyProfileMap.set(profile.user.toString(), profile);
            });

            const repliesWithAvatars = replies.map(reply => {
              const replyAuthorProfile = replyProfileMap.get(reply.author._id.toString());
              return {
                ...reply.toObject(),
                author: {
                  ...reply.author.toObject(),
                  avatar: replyAuthorProfile?.avatar || { url: '/images/default-avatar.png' }
                }
              };
            });

            return {
              ...comment.toObject(),
              author: {
                ...comment.author.toObject(),
                avatar: authorProfile?.avatar || { url: '/images/default-avatar.png' }
              },
              replies: repliesWithAvatars,
              repliesCount: await Comment.countDocuments({ parentComment: comment._id })
            };
          })
        );
      } else {
        // Apenas adicionar avatares sem replies
        commentsWithReplies = comments.map(comment => {
          const authorProfile = profileMap.get(comment.author._id.toString());
          return {
            ...comment.toObject(),
            author: {
              ...comment.author.toObject(),
              avatar: authorProfile?.avatar || { url: '/images/default-avatar.png' }
            }
          };
        });
      }

      // Totais para paginação
      const totalComments = await Comment.countDocuments({ 
        post: postId,
        parentComment: null 
      });

      const totalPages = Math.ceil(totalComments / limit);

      console.log(`✅ Comentários carregados: ${comments.length} de ${totalComments}`);

      res.json({
        success: true,
        data: {
          comments: commentsWithReplies,
          pagination: {
            current: page,
            pages: totalPages,
            total: totalComments,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('❌ Erro ao carregar comentários:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao carregar comentários',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Atualizar comentário com validações
  async updateComment(req, res) {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      console.log(`✏️ Atualizando comentário: ${id}`, { userId });

      // Validações
      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Conteúdo do comentário é obrigatório'
        });
      }

      if (content.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Comentário deve ter pelo menos 2 caracteres'
        });
      }

      if (content.trim().length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Comentário deve ter no máximo 1000 caracteres'
        });
      }

      // Buscar comentário
      const comment = await Comment.findById(id);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comentário não encontrado'
        });
      }

      // Verificar se o usuário é o autor
      if (comment.author.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Você não tem permissão para editar este comentário'
        });
      }

      // Verificar se o comentário não é muito antigo (opcional)
      const commentAge = Date.now() - comment.createdAt.getTime();
      const maxEditTime = 24 * 60 * 60 * 1000; // 24 horas
      
      if (commentAge > maxEditTime) {
        return res.status(400).json({
          success: false,
          message: 'Comentários só podem ser editados até 24 horas após a criação'
        });
      }

      // Atualizar comentário
      comment.content = content.trim();
      comment.isEdited = true;
      comment.updatedAt = new Date();
      
      await comment.save();

      // Popular dados atualizados
      await comment.populate('author', 'name');
      
      // Buscar avatar do autor
      const userProfile = await UserProfile.findOne({ user: userId });
      const commentWithAvatar = {
        ...comment.toObject(),
        author: {
          ...comment.author.toObject(),
          avatar: userProfile?.avatar || { url: '/images/default-avatar.png' }
        }
      };

      console.log(`✅ Comentário atualizado: ${id}`);

      res.json({
        success: true,
        message: 'Comentário atualizado com sucesso!',
        data: {
          comment: commentWithAvatar
        }
      });

    } catch (error) {
      console.error('❌ Erro ao atualizar comentário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao atualizar comentário',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Excluir comentário com todas as validações
  async deleteComment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      console.log(`🗑️ Excluindo comentário: ${id}`, { userId });

      // Buscar comentário
      const comment = await Comment.findById(id);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comentário não encontrado'
        });
      }

      // Verificar se o usuário é o autor
      if (comment.author.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Você não tem permissão para excluir este comentário'
        });
      }

      // Buscar post para atualizar contador
      const post = await Post.findById(comment.post);
      
      // Calcular quantos comentários serão excluídos (incluindo replies)
      const commentsToDelete = await Comment.find({
        $or: [
          { _id: id },
          { parentComment: id }
        ]
      });

      const deleteCount = commentsToDelete.length;

      // Excluir comentário e todas as respostas
      await Comment.deleteMany({
        $or: [
          { _id: id },
          { parentComment: id }
        ]
      });

      // Atualizar contador de comentários do post
      if (post) {
        await Post.findByIdAndUpdate(comment.post, {
          $inc: { commentCount: -deleteCount }
        });
      }

      // Log da atividade
      await Activity.create({
        user: userId,
        action: 'delete_comment',
        targetType: 'comment',
        targetId: id,
        description: `Excluiu um comentário${deleteCount > 1 ? ` e ${deleteCount - 1} respostas` : ''}`
      });

      console.log(`✅ Comentário excluído: ${id} (${deleteCount} itens removidos)`);

      res.json({
        success: true,
        message: deleteCount > 1 
          ? `Comentário e ${deleteCount - 1} respostas excluídos com sucesso!`
          : 'Comentário excluído com sucesso!',
        data: {
          deletedCount: deleteCount
        }
      });

    } catch (error) {
      console.error('❌ Erro ao excluir comentário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao excluir comentário',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Curtir/Descurtir comentário
  async toggleLike(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      console.log(`❤️ Curtindo comentário: ${id}`, { userId });

      // Buscar comentário
      const comment = await Comment.findById(id);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comentário não encontrado'
        });
      }

      // Verificar se já curtiu
      const hasLiked = comment.likes.includes(userId);
      let action = '';

      if (hasLiked) {
        // Remover like
        comment.likes.pull(userId);
        action = 'remove_like_comment';
      } else {
        // Adicionar like
        comment.likes.push(userId);
        action = 'like_comment';
      }

      await comment.save();

      // Log da atividade apenas para like (não para unlike)
      if (!hasLiked) {
        await Activity.create({
          user: userId,
          action: 'like_comment',
          targetType: 'comment',
          targetId: id,
          description: 'Curtiu um comentário'
        });
      }

      console.log(`✅ Like ${hasLiked ? 'removido' : 'adicionado'} no comentário: ${id}`);

      res.json({
        success: true,
        message: hasLiked ? 'Like removido!' : 'Comentário curtido!',
        data: {
          likes: comment.likes.length,
          hasLiked: !hasLiked
        }
      });

    } catch (error) {
      console.error('❌ Erro ao curtir comentário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao curtir comentário',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obter replies de um comentário específico
  async getCommentReplies(req, res) {
    try {
      const { commentId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || this.repliesPerComment;
      const skip = (page - 1) * limit;

      console.log(`🔄 Buscando replies do comentário: ${commentId}`, { page, limit });

      // Verificar se o comentário pai existe
      const parentComment = await Comment.findById(commentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Comentário não encontrado'
        });
      }

      // Buscar replies
      const replies = await Comment.find({ parentComment: commentId })
        .populate('author', 'name')
        .populate({
          path: 'likes',
          select: 'name',
          options: { limit: 5 }
        })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit);

      // Buscar perfis para avatares
      const authorIds = replies.map(reply => reply.author._id);
      const userProfiles = await UserProfile.find({
        user: { $in: authorIds }
      }).select('user avatar');

      const profileMap = new Map();
      userProfiles.forEach(profile => {
        profileMap.set(profile.user.toString(), profile);
      });

      const repliesWithAvatars = replies.map(reply => {
        const authorProfile = profileMap.get(reply.author._id.toString());
        return {
          ...reply.toObject(),
          author: {
            ...reply.author.toObject(),
            avatar: authorProfile?.avatar || { url: '/images/default-avatar.png' }
          }
        };
      });

      // Total de replies
      const totalReplies = await Comment.countDocuments({ parentComment: commentId });
      const totalPages = Math.ceil(totalReplies / limit);

      console.log(`✅ Replies carregadas: ${replies.length} de ${totalReplies}`);

      res.json({
        success: true,
        data: {
          replies: repliesWithAvatars,
          pagination: {
            current: page,
            pages: totalPages,
            total: totalReplies,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('❌ Erro ao carregar replies:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao carregar respostas',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

// Exportar instância do controller
module.exports = new CommentController();