const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['create_post', 'update_post', 'delete_post', 'like_post', 'comment_post', 'register', 'login']
  },
  targetType: {
    type: String,
    enum: ['post', 'comment', 'user', null]
  },
  targetId: mongoose.Schema.Types.ObjectId,
  description: String,
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Índice para buscas eficientes
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ action: 1 });

module.exports = mongoose.model('Activity', activitySchema);