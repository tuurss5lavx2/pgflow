const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  likes: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}],
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Métodos estáticos
postSchema.statics.findByUserId = function(userId) {
  return this.find({ author: userId })
    .populate('author', 'name')
    .sort({ createdAt: -1 });
};

postSchema.statics.findAll = function() {
  return this.find()
    .populate('author', 'name')
    .sort({ createdAt: -1 });
};

postSchema.statics.findById = function(id) {
  return this.findOne({ _id: id })
    .populate('author', 'name');
};

const Post = mongoose.model('Post', postSchema);

module.exports = Post;