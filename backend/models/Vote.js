const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  pollId: {
    type: String,
    required: true,
    index: true
  },
  optionIndex: {
    type: Number,
    required: true
  },
  voterIdentifier: {
    type: String,
    required: true // Hash of IP + User-Agent for fairness
  },
  deviceFingerprint: {
    type: String,
    required: true // Additional device identifier
  },
  ipHash: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

// Compound index for duplicate detection
voteSchema.index({ pollId: 1, voterIdentifier: 1 }, { unique: true });
voteSchema.index({ pollId: 1, ipHash: 1 });

module.exports = mongoose.model('Vote', voteSchema);
