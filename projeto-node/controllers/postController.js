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
      
      // Buscar post com autor populado
      const newPost = await Post.findById(post._id).populate('author', 'name avatar');
      
      res.status(201).json({ 
        message: 'Post criado com sucesso',
        post: {
          _id: newPost._id,
          title: newPost.title,
          content: newPost.content,
          author: newPost.author.name,
          authorAvatar: newPost.author.avatar, // ⬅️ ADICIONAR AQUI
          likes: newPost.likes || [],
          createdAt: newPost.createdAt,
          updatedAt: newPost.updatedAt
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao criar post' });
    }
  },
  
  getAll: async (req, res) => {
    try {
      const posts = await Post.findAll();
      
      // Formatar resposta
      const formattedPosts = posts.map(post => ({
        _id: post._id,
        title: post.title,
        content: post.content,
        author: post.author.name,
        authorAvatar: post.author.avatar, // ⬅️ ADICIONAR AQUI
        likes: post.likes || [],
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      }));
      
      res.json(formattedPosts);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar posts' });
    }
  },
  
  getById: async (req, res) => {
    try {
      const postId = req.params.id;
      
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post não encontrado' });
      }
      
      const formattedPost = {
        _id: post._id,
        title: post.title,
        content: post.content,
        author: post.author.name,
        authorAvatar: post.author.avatar, // ⬅️ ADICIONAR AQUI
        likes: post.likes || [],
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      };
      
      res.json(formattedPost);
    } catch (error) {
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
      
      // Verifica se o usuário é o autor
      if (post.author._id.toString() !== userId) {
        return res.status(403).json({ message: 'Você não tem permissão para editar este post' });
      }
      
      post.title = title;
      post.content = content;
      await post.save();
      
      // Buscar post atualizado
      const updatedPost = await Post.findById(postId).populate('author', 'name avatar');
      
      res.json({ 
        message: 'Post atualizado com sucesso',
        post: {
          _id: updatedPost._id,
          title: updatedPost.title,
          content: updatedPost.content,
          author: updatedPost.author.name,
          authorAvatar: updatedPost.author.avatar, // ⬅️ ADICIONAR AQUI
          likes: updatedPost.likes || [],
          createdAt: updatedPost.createdAt,
          updatedAt: updatedPost.updatedAt
        }
      });
    } catch (error) {
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
      res.status(500).json({ message: 'Erro ao excluir post' });
    }
  },

  // ⬇️⬇️⬇️ ATUALIZAR LIKES TAMBÉM ⬇️⬇️⬇️
  like: async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado' });
        }
        
        // Verifica se usuário já curtiu - LÓGICA CORRIGIDA
        const alreadyLiked = post.likes.includes(userId);
        
        if (alreadyLiked) {
            // REMOVE like se já curtiu
            post.likes = post.likes.filter(likeId => likeId.toString() !== userId);
            await post.save();
            
            const updatedPost = await Post.findById(postId).populate('author', 'name avatar');
            
            return res.json({ 
                message: 'Like removido com sucesso!',
                likes: post.likes.length,
                liked: false,
                post: {
                    _id: updatedPost._id,
                    title: updatedPost.title,
                    content: updatedPost.content,
                    author: updatedPost.author.name,
                    authorAvatar: updatedPost.author.avatar,
                    likes: updatedPost.likes,
                    createdAt: updatedPost.createdAt,
                    updatedAt: updatedPost.updatedAt
                }
            });
        } else {
            // ADICIONA like se não curtiu
            post.likes.push(userId);
            await post.save();
            
            const updatedPost = await Post.findById(postId).populate('author', 'name avatar');
            
            return res.json({ 
                message: 'Post curtido com sucesso!',
                likes: post.likes.length,
                liked: true,
                post: {
                    _id: updatedPost._id,
                    title: updatedPost.title,
                    content: updatedPost.content,
                    author: updatedPost.author.name,
                    authorAvatar: updatedPost.author.avatar,
                    likes: updatedPost.likes,
                    createdAt: updatedPost.createdAt,
                    updatedAt: updatedPost.updatedAt
                }
            });
        }
    } catch (error) {
        console.error('Erro ao curtir post:', error);
        res.status(500).json({ message: 'Erro interno ao curtir post' });
    }
},
  // ⬆️⬆️⬆️ LIKES ATUALIZADOS E CORRETOS ⬆️⬆️⬆️
  
  getByUser: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const posts = await Post.findByUserId(userId);
      
      // Formatar resposta
      const formattedPosts = posts.map(post => ({
        _id: post._id,
        title: post.title,
        content: post.content,
        author: post.author.name,
        authorAvatar: post.author.avatar, // ⬅️ ADICIONAR AQUI
        likes: post.likes || [],
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      }));
      
      res.json(formattedPosts);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar posts' });
    }
  }
};

module.exports = postController;