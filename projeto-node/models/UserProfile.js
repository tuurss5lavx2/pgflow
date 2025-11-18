const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  displayName: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  avatar: {
    url: String,
    publicId: String
  },
  website: String,
  location: String
}, {
  timestamps: true
});

module.exports = mongoose.model('UserProfile', userProfileSchema);