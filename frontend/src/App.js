import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import PollCreation from './components/PollCreation';
import PollView from './components/PollView';
import './styles/App.css';

const HomePage = ({ onNavigateToPoll }) => (
  <div className="home-page">
    <div className="hero-section">
      <h1 className="hero-title">🗳️ Poll Sphere</h1>
      <p className="hero-subtitle">Create polls, share links, and get real-time results</p>
      <div className="hero-features">
        <div className="feature">
          <span className="feature-icon">⚡</span>
          <h3>Real-Time Updates</h3>
          <p>See results updated instantly as users vote</p>
        </div>
        <div className="feature">
          <span className="feature-icon">🔒</span>
          <h3>Fair & Secure</h3>
          <p>Two-layer anti-spam protection keeps voting fair</p>
        </div>
        <div className="feature">
          <span className="feature-icon">📱</span>
          <h3>Easy to Share</h3>
          <p>One-click copy of shareable poll links</p>
        </div>
      </div>
    </div>
    <PollCreation onPollCreated={onNavigateToPoll} />
  </div>
);

const PollPage = () => {
  const { pollId } = useParams();

  return (
    <div className="poll-page">
      <Link to="/" className="back-link">← Back to Home</Link>
      <PollView pollId={pollId} />
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route 
            path="/" 
            element={<HomePage onNavigateToPoll={(pollId) => window.location.href = `/poll/${pollId}`} />}
          />
          <Route path="/poll/:pollId" element={<PollPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
