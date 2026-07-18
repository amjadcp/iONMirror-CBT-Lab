import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  const handleStart = () => {
    // Generate a user-friendly, short random session ID
    const randomId = 'sess_' + Math.random().toString(36).substring(2, 8);
    navigate(`/session/${randomId}/setup`);
  };

  return (
    <div className="landing-container">
      <div className="landing-card">
        <h1 className="landing-title">TCS iON CBT Exam Simulator</h1>
        <p className="landing-desc">
          Prepare for Indian competitive exams (AFCAT, TA, SSC, GATE) in an environment that intentionally mimics the restrictive and high-friction user interface of common TCS iON-style exam centers.
        </p>
        
        <div className="landing-features">
          <div className="feature-item">
            <span className="feature-icon">🚫</span>
            <div>
              <strong>Scroll Restriction:</strong> Disables mouse wheel scrolling inside questions. Must use scrollbars or Top/Bottom buttons.
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📦</span>
            <div>
              <strong>Jarring Blocks:</strong> Question pagination is limited to blocks of 10, preventing smooth scrolling between ranges.
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎨</span>
            <div>
              <strong>Palette Legend:</strong> Live status indicators tracking Not Visited, Answered, Marked, and Answered & Marked.
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🤖</span>
            <div>
              <strong>AI Webhook Integration:</strong> Built-in generator uploads questions directly to a session-specific webhook.
            </div>
          </div>
        </div>

        <button className="cbt-btn cbt-btn-primary landing-btn" onClick={handleStart}>
          Start Practice Session
        </button>
      </div>
    </div>
  );
}
