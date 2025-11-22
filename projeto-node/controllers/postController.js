const Post = require('../models/post');

const postController = {
  getAll: async (req, res) => {
    try {
      console.log('🔍 Buscando posts...');
      
      // ✅ CORREÇÃO: Usar await e tratamento de erro no populate
      const posts = await Post.find()
        .populate('author', 'name avatar')
        .sort({ createdAt: -1 })
        .lean(); // Adicionar lean() para melhor performance
      
      console.log(`✅ ${posts.length} posts encontrados`);
      
      // ✅ CORREÇÃO: Verificar se o autor existe antes de acessar
      const formattedPosts = posts.map(post => {
        // Se o autor foi removido, usar valores padrão
        const authorName = post.author ? post.author.name : 'Usuário Removido';
        const authorAvatar = post.author ? post.author.avatar : 'https://ui-avatars.com/api/?name=Usuario&background=6b7280&color=fff&size=150';
        
        return {
          _id: post._id,
          title: post.title,
          content: post.content,
          author: authorName,
          authorAvatar: authorAvatar,
          likes: post.likes || [],
          likesCount: post.likes ? post.likes.length : 0,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt
        };
      });
      
      res.json(formattedPosts);
    } catch (error) {
      console.error('❌ ERRO AO BUSCAR POSTS:', error);
      res.status(500).json({ 
        message: 'Erro interno ao buscar posts',
        error: error.message 
      });
    }
  },

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
      
      // ✅ CORREÇÃO: Buscar post com populate seguro
      const newPost = await Post.findById(post._id)
        .populate('author', 'name avatar')
        .lean();
      
      // Verificar se autor existe
      const authorName = newPost.author ? newPost.author.name : 'Usuário';
      const authorAvatar = newPost.author ? newPost.author.avatar : 'https://ui-avatars.com/api/?name=Usuario&background=6b7280&color=fff&size=150';
      
      res.status(201).json({ 
        message: 'Post criado com sucesso',
        post: {
          _id: newPost._id,
          title: newPost.title,
          content: newPost.content,
          author: authorName,
          authorAvatar: authorAvatar,
          likes: newPost.likes || [],
          likesCount: newPost.likes ? newPost.likes.length : 0,
          createdAt: newPost.createdAt,
          updatedAt: newPost.updatedAt
        }
      });
    } catch (error) {
      console.error('Erro ao criar post:', error);
      res.status(500).json({ message: 'Erro ao criar post' });
    }
  },
  
  getById: async (req, res) => {
    try {
      const postId = req.params.id;
      
      const post = await Post.findById(postId)
        .populate('author', 'name avatar')
        .lean();
      
      if (!post) {
        return res.status(404).json({ message: 'Post não encontrado' });
      }
      
      // Verificar se autor existe
      const authorName = post.author ? post.author.name : 'Usuário Removido';
      const authorAvatar = post.author ? post.author.avatar : 'https://ui-avatars.com/api/?name=Usuario&background=6b7280&color=fff&size=150';
      
      const formattedPost = {
        _id: post._id,
        title: post.title,
        content: post.content,
        author: authorName,
        authorAvatar: authorAvatar,
        likes: post.likes || [],
        likesCount: post.likes ? post.likes.length : 0,
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
        
        // ✅ MESMA CORREÇÃO AQUI
        if (post.author.toString() !== userId) {
            return res.status(403).json({ 
                message: 'Você não tem permissão para editar este post' 
            });
        }
        
        post.title = title;
        post.content = content;
        await post.save();
        
        const updatedPost = await Post.findById(postId)
            .populate('author', 'name avatar')
            .lean();

        const authorName = updatedPost.author ? updatedPost.author.name : 'Usuário';
        const authorAvatar = updatedPost.author ? updatedPost.author.avatar : 'https://ui-avatars.com/api/?name=Usuario&background=6b7280&color=fff&size=150';
        
        res.json({ 
            message: 'Post atualizado com sucesso',
            post: {
                _id: updatedPost._id,
                title: updatedPost.title,
                content: updatedPost.content,
                author: authorName,
                authorAvatar: authorAvatar,
                likes: updatedPost.likes || [],
                likesCount: updatedPost.likes ? updatedPost.likes.length : 0,
                createdAt: updatedPost.createdAt,
                updatedAt: updatedPost.updatedAt
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar post:', error);
        res.status(500).json({ message: 'Erro ao atualizar post' });
    }
},

  getByUser: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const posts = await Post.find({ author: userId })
        .populate('author', 'name avatar')
        .sort({ createdAt: -1 })
        .lean();
      
      const formattedPosts = posts.map(post => {
        const authorName = post.author ? post.author.name : 'Usuário';
        const authorAvatar = post.author ? post.author.avatar : 'https://ui-avatars.com/api/?name=Usuario&background=6b7280&color=fff&size=150';
        
        return {
          _id: post._id,
          title: post.title,
          content: post.content,
          author: authorName,
          authorAvatar: authorAvatar,
          likes: post.likes || [],
          likesCount: post.likes ? post.likes.length : 0,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt
        };
      });
      
      res.json(formattedPosts);
    } catch (error) {
      console.error('Erro ao buscar posts do usuário:', error);
      res.status(500).json({ message: 'Erro ao buscar posts' });
    }
  },

  // ✅ LIKE CORRIGIDO - COMPARAÇÃO CORRETA DE IDs
  like: async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.user.id;

      console.log('Like request - Post ID:', postId, 'User ID:', userId);

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post não encontrado' });
      }

      // ✅ CORREÇÃO: Verifica se usuário já curtiu - comparação correta
      const userAlreadyLiked = post.likes.some(likeId => 
        likeId.toString() === userId
      );

      console.log('User already liked:', userAlreadyLiked);
      console.log('Current likes:', post.likes);

      if (userAlreadyLiked) {
        // Remove o like - CORREÇÃO AQUI
        post.likes = post.likes.filter(likeId => 
          likeId.toString() !== userId
        );
        await post.save();
        
        console.log('Like removed. New likes:', post.likes);
        
        return res.json({ 
          likesCount: post.likes.length,
          liked: false
        });
      } else {
        // Adiciona o like
        post.likes.push(userId);
        await post.save();
        
        console.log('Like added. New likes:', post.likes);
        
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
  
  delete: async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        
        console.log('🗑️ DEBUG EXCLUSÃO:');
        console.log('• Post ID:', postId);
        console.log('• User ID:', userId);
        
        // ✅ BUSCAR POST COM POPULATE PARA VER O AUTOR
        const post = await Post.findById(postId).populate('author', '_id name');
        
        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado' });
        }
        
        console.log('• Autor do post:', post.author);
        console.log('• ID do autor:', post.author._id);
        console.log('• Nome do autor:', post.author.name);
        
        // ✅ CORREÇÃO: Comparar ObjectIds corretamente
        const isAuthor = post.author._id.toString() === userId;
        console.log('• É autor?', isAuthor);
        
        if (!isAuthor) {
            return res.status(403).json({ 
                message: 'Você não tem permissão para excluir este post' 
            });
        }
        
        await Post.findByIdAndDelete(postId);
        console.log('✅ Post excluído com sucesso');
        
        res.json({ message: 'Post excluído com sucesso' });
    } catch (error) {
        console.error('❌ Erro ao excluir post:', error);
        res.status(500).json({ 
            message: 'Erro ao excluir post',
            error: error.message 
        });
    }
}};

module.exports = postController;