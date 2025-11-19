const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// ✅ MÉTODO PARA TOGGLE LIKE GARANTINDO UNICIDADE
postSchema.methods.toggleLike = function(userId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  // Verifica se usuário já deu like
  const userAlreadyLiked = this.likes.some(likeId => 
    likeId.toString() === userObjectId.toString()
  );
  
  if (userAlreadyLiked) {
    // Remove like
    this.likes = this.likes.filter(likeId => 
      likeId.toString() !== userObjectId.toString()
    );
    return false; // like removido
  } else {
    // Adiciona like
    this.likes.push(userObjectId);
    return true; // like adicionado
  }
};

// Métodos estáticos
postSchema.statics.findByUserId = function(userId) {
  return this.find({ author: userId })
    .populate('author', 'name avatar')
    .populate('likes', 'name')
    .sort({ createdAt: -1 });
};

postSchema.statics.findAll = function() {
  return this.find()
    .populate('author', 'name avatar')
    .populate('likes', 'name')
    .sort({ createdAt: -1 });
};

postSchema.statics.findById = function(id) {
  return this.findOne({ _id: id })
    .populate('author', 'name avatar')
    .populate('likes', 'name');
};

const Post = mongoose.model('Post', postSchema);

module.exports = Post;