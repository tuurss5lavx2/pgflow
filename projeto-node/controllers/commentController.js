const Comment = require('../models/comment');
const Post = require('../models/post');

const commentController = {
  create: async (req, res) => {
    try {
      const { content, postId } = req.body;
      const userId = req.user.id;

      if (!content || !postId) {
        return res.status(400).json({ message: 'Conteúdo e post são obrigatórios' });
      }

      // Verifica se o post existe
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post não encontrado' });
      }

      const comment = await Comment.create({
        content,
        author: userId,
        post: postId
      });

      const newComment = await Comment.findById(comment._id)
        .populate('author', 'name avatar');

      res.status(201).json({
        message: 'Comentário adicionado com sucesso!',
        comment: {
          _id: newComment._id,
          content: newComment.content,
          author: newComment.author.name,
          authorAvatar: newComment.author.avatar,
          likes: newComment.likes || [],
          likesCount: newComment.likes.length,
          createdAt: newComment.createdAt,
          updatedAt: newComment.updatedAt
        }
      });

    } catch (error) {
      console.error('Erro ao criar comentário:', error);
      res.status(500).json({ message: 'Erro ao criar comentário' });
    }
  },

  getByPost: async (req, res) => {
    try {
      const postId = req.params.postId;

      const comments = await Comment.findByPostId(postId);

      const formattedComments = comments.map(comment => ({
        _id: comment._id,
        content: comment.content,
        author: comment.author.name,
        authorAvatar: comment.author.avatar,
        likes: comment.likes || [],
        likesCount: comment.likes.length,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt
      }));

      res.json(formattedComments);

    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      res.status(500).json({ message: 'Erro ao buscar comentários' });
    }
  },

  delete: async (req, res) => {
    try {
      const commentId = req.params.id;
      const userId = req.user.id;

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({ message: 'Comentário não encontrado' });
      }

      // Verifica se é o autor do comentário
      if (comment.author.toString() !== userId) {
        return res.status(403).json({ message: 'Você não tem permissão para excluir este comentário' });
      }

      await Comment.findByIdAndDelete(commentId);

      res.json({ message: 'Comentário excluído com sucesso' });

    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      res.status(500).json({ message: 'Erro ao excluir comentário' });
    }
  },

  like: async (req, res) => {
    try {
      const commentId = req.params.id;
      const userId = req.user.id;

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({ message: 'Comentário não encontrado' });
      }

      // Verifica se usuário já curtiu
      const userIndex = comment.likes.findIndex(like => 
        like.toString() === userId
      );

      if (userIndex > -1) {
        // Remove like
        comment.likes.splice(userIndex, 1);
        await comment.save();
        
        return res.json({ 
          likesCount: comment.likes.length,
          liked: false
        });
      } else {
        // Adiciona like
        comment.likes.push(userId);
        await comment.save();
        
        return res.json({ 
          likesCount: comment.likes.length,
          liked: true
        });
      }
    } catch (error) {
      console.error('Erro no like do comentário:', error);
      res.status(500).json({ message: 'Erro interno ao curtir comentário' });
    }
  }
};

module.exports = commentController;