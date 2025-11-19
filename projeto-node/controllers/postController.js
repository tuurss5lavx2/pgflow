const Post = require('../models/post');

const postController = {
  create: async (req, res) => {
    try {
      const { title, content } = req.body;
      const userId = req.user.id;
      
      if (!title || !content) {
        return res.status(400).json({ message: 'Título e conteúdo são obrigatórios' });
      }
      
      const post = await Post.create({ 
        title, 
        content, 
        author: userId 
      });
      
      const newPost = await Post.findById(post._id).populate('author', 'name avatar');
      
      res.status(201).json({ 
        message: 'Post criado com sucesso',
        post: {
          _id: newPost._id,
          title: newPost.title,
          content: newPost.content,
          author: newPost.author.name,
          authorAvatar: newPost.author.avatar,
          likes: newPost.likes || [],
          likesCount: newPost.likes.length,
          createdAt: newPost.createdAt,
          updatedAt: newPost.updatedAt
        }
      });
    } catch (error) {
      console.error('Erro ao criar post:', error);
      res.status(500).json({ message: 'Erro ao criar post' });
    }
  },
  
  getAll: async (req, res) => {
    try {
      const posts = await Post.find()
        .populate('author', 'name avatar')
        .sort({ createdAt: -1 });
      
      const formattedPosts = posts.map(post => ({
        _id: post._id,
        title: post.title,
        content: post.content,
        author: post.author.name,
        authorAvatar: post.author.avatar,
        likes: post.likes || [],
        likesCount: post.likes.length,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      }));
      
      res.json(formattedPosts);
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      res.status(500).json({ message: 'Erro ao buscar posts' });
    }
  },
  
  getById: async (req, res) => {
    try {
      const postId = req.params.id;
      
      const post = await Post.findById(postId).populate('author', 'name avatar');
      if (!post) {
        return res.status(404).json({ message: 'Post não encontrado' });
      }
      
      const formattedPost = {
        _id: post._id,
        title: post.title,
        content: post.content,
        author: post.author.name,
        authorAvatar: post.author.avatar,
        likes: post.likes || [],
        likesCount: post.likes.length,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      };
      
      res.json(formattedPost);
    } catch (error) {
      console.error('Erro ao buscar post:', error);
      res.status(500).json({ message: 'Erro ao buscar post' });
    }
  },
  
  update: async (req, res) => {
    try {
      const postId = req.params.id;
      const { title, content } = req.body;
      const userId = req.user.id;
      
      if (!title || !content) {
        return res.status(400).json({ message: 'Título e conteúdo são obrigatórios' });
      }
      
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post não encontrado' });
      }
      
      if (post.author._id.toString() !== userId) {
        return res.status(403).json({ message: 'Você não tem permissão para editar este post' });
      }
      
      post.title = title;
      post.content = content;
      await post.save();
      
      const updatedPost = await Post.findById(postId).populate('author', 'name avatar');
      
      res.json({ 
        message: 'Post atualizado com sucesso',
        post: {
          _id: updatedPost._id,
          title: updatedPost.title,
          content: updatedPost.content,
          author: updatedPost.author.name,
          authorAvatar: updatedPost.author.avatar,
          likes: updatedPost.likes || [],
          likesCount: updatedPost.likes.length,
          createdAt: updatedPost.createdAt,
          updatedAt: updatedPost.updatedAt
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar post:', error);
      res.status(500).json({ message: 'Erro ao atualizar post' });
    }
  },
  
  delete: async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.user.id;
      
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post não encontrado' });
      }
      
      if (post.author._id.toString() !== userId) {
        return res.status(403).json({ message: 'Você não tem permissão para excluir este post' });
      }
      
      await Post.findByIdAndDelete(postId);
      
      res.json({ message: 'Post excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir post:', error);
      res.status(500).json({ message: 'Erro ao excluir post' });
    }
  },

   // ✅ LIKE CORRIGIDO - SÓ PERMITE 1 LIKE POR USUÁRIO
  like: async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.user.id;

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post não encontrado' });
      }

      // Verifica se usuário já curtiu - CORREÇÃO AQUI
      const userAlreadyLiked = post.likes.some(like => 
        like.toString() === userId.toString()
      );

      if (userAlreadyLiked) {
        // Remove o like
        post.likes = post.likes.filter(like => 
          like.toString() !== userId.toString()
        );
        await post.save();
        
        return res.json({ 
          likesCount: post.likes.length,
          liked: false
        });
      } else {
        // Adiciona o like
        post.likes.push(userId);
        await post.save();
        
        return res.json({ 
          likesCount: post.likes.length,
          liked: true
        });
      }
    } catch (error) {
      console.error('Erro no like:', error);
      res.status(500).json({ message: 'Erro interno ao curtir post' });
    }
  },
  
  getByUser: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const posts = await Post.find({ author: userId })
        .populate('author', 'name avatar')
        .sort({ createdAt: -1 });
      
      const formattedPosts = posts.map(post => ({
        _id: post._id,
        title: post.title,
        content: post.content,
        author: post.author.name,
        authorAvatar: post.author.avatar,
        likes: post.likes || [],
        likesCount: post.likes.length,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      }));
      
      res.json(formattedPosts);
    } catch (error) {
      console.error('Erro ao buscar posts do usuário:', error);
      res.status(500).json({ message: 'Erro ao buscar posts' });
    }
  }
};

module.exports = postController;