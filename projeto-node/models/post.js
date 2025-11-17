// models/post.js
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
  }
}, {
  timestamps: true
});

// Métodos estáticos (equivalente aos seus métodos)
postSchema.statics.findByUserId = function(userId) {
  return this.find({ author: userId }).populate('author', 'name email');
};

const Post = mongoose.model('Post', postSchema);

module.exports = Post;