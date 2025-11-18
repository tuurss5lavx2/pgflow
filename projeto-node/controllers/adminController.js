const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('../models/Comment');
const Category = require('../models/Category');
const Activity = require('../models/Activity');

const adminController = {
  // Estatísticas gerais
  getStats: async (req, res) => {
    try {
      const [
        totalUsers,
        totalPosts,
        totalComments,
        totalLikes,
        recentActivities,
        popularPosts
      ] = await Promise.all([
        User.countDocuments(),
        Post.countDocuments({ isPublished: true }),
        Comment.countDocuments(),
        Post.aggregate([
          { $match: { isPublished: true } },
          { $group: { _id: null, total: { $sum: '$likeCount' } } }
        ]),
        Activity.find()
          .populate('user', 'name')
          .sort({ createdAt: -1 })
          .limit(10),
        Post.find({ isPublished: true })
          .populate('author', 'name')
          .sort({ likeCount: -1 })
          .limit(5)
      ]);
      
      // Estatísticas de crescimento (últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const [
        newUsersThisWeek,
        newPostsThisWeek
      ] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        Post.countDocuments({ 
          isPublished: true,
          createdAt: { $gte: sevenDaysAgo } 
        })
      ]);
      
      res.json({
        stats: {
          users: totalUsers,
          posts: totalPosts,
          comments: totalComments,
          likes: totalLikes[0]?.total || 0,
          newUsersThisWeek,
          newPostsThisWeek
        },
        recentActivities,
        popularPosts
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao carregar estatísticas' });
    }
  },
  
  // Gerenciar usuários
  getUsers: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      const users = await User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await User.countDocuments();
      
      res.json({
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao carregar usuários' });
    }
  },
  
  // Atualizar usuário
  updateUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const { role, isActive } = req.body;
      
      const user = await User.findByIdAndUpdate(
        userId,
        { role, isActive },
        { new: true }
      ).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      res.json({
        message: 'Usuário atualizado com sucesso!',
        user
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao atualizar usuário' });
    }
  },
  
  // Gerenciar posts
  getPosts: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const { status } = req.query;
      
      const query = {};
      if (status === 'published') query.isPublished = true;
      if (status === 'draft') query.isPublished = false;
      
      const posts = await Post.find(query)
        .populate('author', 'name')
        .populate('categories', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Post.countDocuments(query);
      
      res.json({
        posts,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao carregar posts' });
    }
  },
  
  // Atualizar post
  updatePost: async (req, res) => {
    try {
      const { postId } = req.params;
      const { isPublished } = req.body;
      
      const post = await Post.findByIdAndUpdate(
        postId,
        { isPublished },
        { new: true }
      ).populate('author', 'name');
      
      if (!post) {
        return res.status(404).json({ message: 'Post não encontrado' });
      }
      
      res.json({
        message: 'Post atualizado com sucesso!',
        post
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao atualizar post' });
    }
  },
  
  // Excluir post (admin)
  deletePost: async (req, res) => {
    try {
      const { postId } = req.params;
      
      const post = await Post.findByIdAndDelete(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post não encontrado' });
      }
      
      // Excluir comentários relacionados
      await Comment.deleteMany({ post: postId });
      
      res.json({ message: 'Post excluído com sucesso!' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao excluir post' });
    }
  },
  
  // Gerenciar categorias
  getCategories: async (req, res) => {
    try {
      const categories = await Category.find().sort({ name: 1 });
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao carregar categorias' });
    }
  },
  
  createCategory: async (req, res) => {
    try {
      const { name, description, color } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: 'Nome da categoria é obrigatório' });
      }
      
      const category = await Category.create({
        name: name.trim(),
        description: description?.trim(),
        color: color || '#6B7280'
      });
      
      res.status(201).json({
        message: 'Categoria criada com sucesso!',
        category
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: 'Categoria já existe' });
      }
      res.status(500).json({ message: 'Erro ao criar categoria' });
    }
  },
  
  updateCategory: async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { name, description, color } = req.body;
      
      const category = await Category.findByIdAndUpdate(
        categoryId,
        {
          name: name?.trim(),
          description: description?.trim(),
          color
        },
        { new: true }
      );
      
      if (!category) {
        return res.status(404).json({ message: 'Categoria não encontrada' });
      }
      
      res.json({
        message: 'Categoria atualizada com sucesso!',
        category
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: 'Categoria já existe' });
      }
      res.status(500).json({ message: 'Erro ao atualizar categoria' });
    }
  },
  
  deleteCategory: async (req, res) => {
    try {
      const { categoryId } = req.params;
      
      // Verificar se há posts usando esta categoria
      const postsWithCategory = await Post.countDocuments({ categories: categoryId });
      if (postsWithCategory > 0) {
        return res.status(400).json({ 
          message: 'Não é possível excluir categoria com posts associados' 
        });
      }
      
      const category = await Category.findByIdAndDelete(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Categoria não encontrada' });
      }
      
      res.json({ message: 'Categoria excluída com sucesso!' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao excluir categoria' });
    }
  }
};

module.exports = adminController;