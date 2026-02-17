const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');

// Create a new poll
router.post('/create', async (req, res) => {
  try {
    const { question, options } = req.body;

    if (!question || !options || options.length < 2) {
      return res.status(400).json({
        error: 'Poll must have a question and at least 2 options'
      });
    }

    const pollId = uuidv4();
    const pollOptions = options.map(text => ({
      text: text.trim(),
      voteCount: 0
    }));

    const poll = new Poll({
      pollId,
      question: question.trim(),
      options: pollOptions
    });

    await poll.save();

    res.json({
      pollId,
      shareLink: `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/poll/${pollId}`
    });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
});

// Get poll by ID
router.get('/:pollId', async (req, res) => {
  try {
    const { pollId } = req.params;
    const poll = await Poll.findOne({ pollId });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    res.json({
      pollId: poll.pollId,
      question: poll.question,
      options: poll.options,
      totalVotes: poll.totalVotes,
      isActive: poll.isActive,
      createdAt: poll.createdAt
    });
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ error: 'Failed to fetch poll' });
  }
});

// Get poll results with detailed stats
router.get('/:pollId/results', async (req, res) => {
  try {
    const { pollId } = req.params;
    const poll = await Poll.findOne({ pollId });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const results = poll.options.map((option, index) => ({
      index,
      text: option.text,
      votes: option.voteCount,
      percentage: poll.totalVotes > 0 ? ((option.voteCount / poll.totalVotes) * 100).toFixed(1) : 0
    }));

    res.json({
      pollId: poll.pollId,
      question: poll.question,
      results,
      totalVotes: poll.totalVotes,
      createdAt: poll.createdAt
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

module.exports = router;
