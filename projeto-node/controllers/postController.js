// controllers/postController.js
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
      
      // Popula o autor para retornar
      await post.populate('author', 'name');
      
      res.status(201).json({ 
        message: 'Post criado com sucesso',
        post: post
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao criar post' });
    }
  },
  
  getAll: async (req, res) => {
    try {
      const posts = await Post.find()
        .populate('author', 'name')
        .sort({ createdAt: -1 });
      
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar posts' });
    }
  },
  
  getById: async (req, res) => {
    try {
      const postId = req.params.id;
      
      const post = await Post.findById(postId).populate('author', 'name');
      if (!post) {
        return res.status(404).json({ message: 'Post não encontrado' });
      }
      
      res.json(post);
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
      if (post.author.toString() !== userId) {
        return res.status(403).json({ message: 'Você não tem permissão para editar este post' });
      }
      
      post.title = title;
      post.content = content;
      await post.save();
      
      res.json({ message: 'Post atualizado com sucesso' });
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
      
      if (post.author.toString() !== userId) {
        return res.status(403).json({ message: 'Você não tem permissão para excluir este post' });
      }
      
      await Post.findByIdAndDelete(postId);
      
      res.json({ message: 'Post excluído com sucesso' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao excluir post' });
    }
  },
  
  getByUser: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const posts = await Post.find({ author: userId })
        .populate('author', 'name')
        .sort({ createdAt: -1 });
      
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar posts' });
    }
  }
};

module.exports = postController;