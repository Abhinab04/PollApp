import React, { useState } from 'react';
import axios from 'axios';
import '../styles/PollCreation.css';

const PollCreation = ({ onPollCreated }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareLink, setShareLink] = useState('');

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!question.trim()) {
      setError('Please enter a question');
      setLoading(false);
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      setError('Please provide at least 2 options');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/polls/create', {
        question: question.trim(),
        options: validOptions
      });

      const { pollId, shareLink: link } = response.data;
      setShareLink(link);
      setQuestion('');
      setOptions(['', '']);
      
      if (onPollCreated) {
        onPollCreated(pollId);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="poll-creation">
      <div className="creation-card">
        <h2 className="creation-title">✨ Create a New Poll</h2>
        
        {shareLink && (
          <div className="success-message">
            <p>🎉 Poll created successfully!</p>
            <div className="share-section">
              <label>Share Link:</label>
              <input 
                type="text" 
                value={shareLink} 
                readOnly 
                onClick={(e) => e.target.select()}
                className="share-input"
              />
              <button 
                className="copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(shareLink);
                  alert('Link copied to clipboard!');
                }}
              >
                📋 Copy Link
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="question">Poll Question *</label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to ask?"
              rows="3"
              className="question-input"
            />
          </div>

          <div className="options-section">
            <label>Options (at least 2) *</label>
            {options.map((option, index) => (
              <div key={index} className="option-input-group">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="option-input"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeOption(index)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button type="button" className="add-option-btn" onClick={addOption}>
            + Add Option
          </button>

          {error && <p className="error-message">{error}</p>}

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating...' : '🚀 Create Poll'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PollCreation;
