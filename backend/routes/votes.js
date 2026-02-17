const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');
const { generateVoterIdentifier, generateIpHash, getClientIP } = require('../middleware/fairness');
const rateLimit = require('express-rate-limit');

// Rate limiter: max 10 votes per IP per hour
const voteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many votes from this IP, please try again later.',
  keyGenerator: (req) => getClientIP(req),
  skip: (req) => process.env.NODE_ENV === 'test'
});

// Submit a vote
router.post('/:pollId/vote', voteLimiter, async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionIndex } = req.body;
    
    const poll = await Poll.findOne({ pollId });
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (!poll.isActive) {
      return res.status(400).json({ error: 'Poll is no longer active' });
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ error: 'Invalid option' });
    }

    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const voterIdentifier = generateVoterIdentifier(clientIP, userAgent);
    const ipHash = generateIpHash(clientIP);
    
    // Generate device fingerprint from headers
    const deviceFingerprint = generateVoterIdentifier(
      userAgent,
      req.headers['accept-language'] || ''
    );

    // FAIRNESS MECHANISM 1: Check for duplicate vote from same device
    const existingVote = await Vote.findOne({
      pollId,
      voterIdentifier
    });

    if (existingVote) {
      return res.status(403).json({
        error: 'You have already voted on this poll',
        remainingTime: 'You can vote again after 24 hours'
      });
    }

    // FAIRNESS MECHANISM 2: Rate limit by IP address
    // Check if more than 5 votes from same IP in last hour (already handled by middleware)
    const recentVotesFromIP = await Vote.countDocuments({
      pollId,
      ipHash,
      createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
    });

    if (recentVotesFromIP >= 3) {
      return res.status(429).json({
        error: 'Too many rapid votes from your network. Please wait a moment.'
      });
    }

    // Create the vote
    const vote = new Vote({
      pollId,
      optionIndex,
      voterIdentifier,
      deviceFingerprint,
      ipHash
    });

    await vote.save();

    // Update poll statistics
    poll.options[optionIndex].voteCount += 1;
    poll.totalVotes += 1;
    await poll.save();

    res.json({
      success: true,
      message: 'Vote recorded successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(403).json({
        error: 'You have already voted on this poll'
      });
    }
    console.error('Error recording vote:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Check if user has already voted
router.get('/:pollId/hasVoted', async (req, res) => {
  try {
    const { pollId } = req.params;
    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const voterIdentifier = generateVoterIdentifier(clientIP, userAgent);

    const vote = await Vote.findOne({
      pollId,
      voterIdentifier
    });

    res.json({
      hasVoted: !!vote,
      votedOption: vote ? vote.optionIndex : null
    });
  } catch (error) {
    console.error('Error checking vote status:', error);
    res.status(500).json({ error: 'Failed to check vote status' });
  }
});

module.exports = router;
