const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  pollId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [
    {
      _id: false,
      text: {
        type: String,
        required: true
      },
      voteCount: {
        type: Number,
        default: 0
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000) // 30 days
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// TTL index to auto-delete expired polls after 30 days
pollSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Poll', pollSchema);
