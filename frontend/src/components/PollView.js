import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import '../styles/PollView.css';

const PollView = ({ pollId, onPollData }) => {
  const [poll, setPoll] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);
  const [pollFound, setPollFound] = useState(true);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (!pollId) return;

    const fetchPoll = async () => {
      try {
        const [pollRes, voteRes] = await Promise.all([
          axios.get(`/api/polls/${pollId}`),
          axios.get(`/api/votes/${pollId}/hasVoted`)
        ]);

        setPoll(pollRes.data);
        setHasVoted(voteRes.data.hasVoted);
        if (voteRes.data.hasVoted) {
          setSelectedOption(voteRes.data.votedOption);
        }
        setPollFound(true);
        
        if (onPollData) {
          onPollData(pollRes.data);
        }
      } catch (err) {
        console.error('Error fetching poll:', err);
        setPollFound(false);
        setError('Poll not found or no longer available');
      }
    };

    fetchPoll();

    if (socket) {
      socket.emit('joinPoll', pollId);

      socket.on('resultsUpdated', (data) => {
        fetchPoll(); // Refresh poll data on update
      });
    }

    return () => {
      if (socket) {
        socket.emit('leavePoll', pollId);
        socket.off('resultsUpdated');
      }
    };
  }, [pollId, socket, onPollData]);

  const handleVote = async (optionIndex) => {
    if (hasVoted) {
      setError('You have already voted on this poll');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`/api/votes/${pollId}/vote`, {
        optionIndex
      });

      setHasVoted(true);
      setSelectedOption(optionIndex);

      // Emit vote event through socket
      if (socket) {
        socket.emit('voteSubmitted', { pollId });
      }

      // Refresh poll data
      const response = await axios.get(`/api/polls/${pollId}`);
      setPoll(response.data);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to submit vote';
      setError(errorMsg);
      console.error('Error submitting vote:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!pollFound) {
    return (
      <div className="poll-view">
        <div className="poll-card error-card">
          <h2>❌ Poll Not Found</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="poll-view">
        <div className="poll-card loading-card">
          <div className="spinner"></div>
          <p>Loading poll...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="poll-view">
      <div className="poll-card">
        <div className="poll-header">
          <h2>{poll.question}</h2>
          <div className="poll-meta">
            <span>📊 {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}</span>
            <span>📅 Created {new Date(poll.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {hasVoted && (
          <div className="voted-badge">✅ You voted on this poll</div>
        )}

        {error && <p className="error-message">{error}</p>}

        <div className="options-list">
          {poll.options.map((option, index) => {
            const percentage = poll.totalVotes > 0 
              ? ((option.voteCount / poll.totalVotes) * 100).toFixed(1)
              : 0;

            return (
              <div key={index} className="option-item">
                <button
                  className={`option-button ${selectedOption === index ? 'selected' : ''} ${hasVoted ? 'disabled' : ''}`}
                  onClick={() => handleVote(index)}
                  disabled={hasVoted || loading}
                >
                  <span className="option-circle"></span>
                  <span className="option-text">{option.text}</span>
                </button>
                
                <div className="vote-bar-container">
                  <div 
                    className="vote-bar"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                
                <div className="vote-stats">
                  <span className="vote-count">{option.voteCount}</span>
                  <span className="vote-percentage">{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {hasVoted && (
          <p className="voted-message">
            Thank you for voting! Results will update in real-time as others vote.
          </p>
        )}

        {!hasVoted && (
          <p className="voting-prompt">
            👇 Click on an option to vote
          </p>
        )}
      </div>
    </div>
  );
};

export default PollView;
