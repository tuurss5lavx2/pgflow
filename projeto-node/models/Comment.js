const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Métodos estáticos
commentSchema.statics.findByPostId = function(postId) {
  return this.find({ post: postId })
    .populate('author', 'name avatar')
    .sort({ createdAt: -1 });
};

commentSchema.statics.findByUserId = function(userId) {
  return this.find({ author: userId })
    .populate('post', 'title')
    .populate('author', 'name avatar')
    .sort({ createdAt: -1 });
};

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;