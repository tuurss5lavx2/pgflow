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

// ⬇️⬇️⬇️ ATUALIZAR ESTES MÉTODOS PARA INCLUIR AVATAR ⬇️⬇️⬇️
postSchema.statics.findByUserId = function(userId) {
  return this.find({ author: userId })
    .populate('author', 'name avatar') // ⬅️ ADICIONAR avatar AQUI
    .populate('likes', 'name')
    .sort({ createdAt: -1 });
};

postSchema.statics.findAll = function() {
  return this.find()
    .populate('author', 'name avatar') // ⬅️ ADICIONAR avatar AQUI
    .populate('likes', 'name')
    .sort({ createdAt: -1 });
};

postSchema.statics.findById = function(id) {
  return this.findOne({ _id: id })
    .populate('author', 'name avatar') // ⬅️ ADICIONAR avatar AQUI
    .populate('likes', 'name');
};
// ⬆️⬆️⬆️ ATUALIZAR ESTES MÉTODOS ⬆️⬆️⬆️

const Post = mongoose.model('Post', postSchema);

module.exports = Post;