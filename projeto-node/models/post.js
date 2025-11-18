const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    maxlength: 300
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  tags: [String],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likeCount: {
    type: Number,
    default: 0
  },
  commentCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  featuredImage: {
    url: String,
    publicId: String
  }
}, {
  timestamps: true
});

// Gerar excerpt automaticamente
postSchema.pre('save', function(next) {
  if (this.content && !this.excerpt) {
    this.excerpt = this.content.substring(0, 250) + '...';
  }
  next();
});

// Atualizar contadores
postSchema.pre('save', function(next) {
  this.likeCount = this.likes.length;
  next();
});

// Métodos estáticos atualizados
postSchema.statics.findByUserId = function(userId) {
  return this.find({ author: userId })
    .populate('author', 'name')
    .populate('categories', 'name color')
    .sort({ createdAt: -1 });
};

postSchema.statics.findAll = function() {
  return this.find({ isPublished: true })
    .populate('author', 'name')
    .populate('categories', 'name color')
    .sort({ createdAt: -1 });
};

postSchema.statics.findById = function(id) {
  return this.findOne({ _id: id })
    .populate('author', 'name')
    .populate('categories', 'name color');
};

postSchema.statics.findByCategory = function(categoryId) {
  return this.find({ categories: categoryId, isPublished: true })
    .populate('author', 'name')
    .populate('categories', 'name color')
    .sort({ createdAt: -1 });
};

postSchema.statics.search = function(query) {
  return this.find({
    isPublished: true,
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { content: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  })
  .populate('author', 'name')
  .populate('categories', 'name color')
  .sort({ createdAt: -1 });
};

// Índices para performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ categories: 1 });
postSchema.index({ likeCount: -1 });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;