import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { setPersistentSessionId } from '../utils/session';

export default function CandidateLogin() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [candidateId, setCandidateId] = useState('');
  const [password, setPassword] = useState('••••••••');
  const [examTime, setExamTime] = useState(10);

  // Sync persistent session ID in browser storage
  useEffect(() => {
    if (sessionId) {
      setPersistentSessionId(sessionId);
    }
  }, [sessionId]);

  // Generate a random candidate ID on mount
  useEffect(() => {
    const randomId = Math.floor(10000000 + Math.random() * 90000000).toString();
    setCandidateId(randomId);
  }, []);

  const handleSignIn = (e) => {
    e.preventDefault();
    navigate(`/session/${sessionId}?time=${examTime}`);
  };

  // Virtual keyboard layout keys
  const keyboardKeys = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
    'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
    'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Del',
    'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Clear'
  ];

  return (
    <div className="login-screen-wrapper">
      {/* Top Header */}
      <header className="login-header">
        <span className="login-system-name">System_Practice_001</span>
        <h1 className="login-header-title">Candidate Login</h1>
      </header>

      {/* Main Login Card */}
      <div className="login-card-container">
        <form onSubmit={handleSignIn} className="login-card">
          <div className="login-card-header">
            <h3>Login Details</h3>
          </div>
          
          <div className="login-card-body">
            {/* Left side: Inputs & Keyboard */}
            <div className="login-body-left">
              <div className="login-input-group">
                <label htmlFor="userId">Candidate ID</label>
                <input 
                  type="text" 
                  id="userId" 
                  value={candidateId} 
                  onChange={(e) => setCandidateId(e.target.value)} 
                  required
                />
              </div>

              <div className="login-input-group">
                <label htmlFor="password">Password</label>
                <div className="login-pwd-wrapper">
                  <input 
                    type="password" 
                    id="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required
                  />
                  <span className="login-kbd-icon" title="Virtual Keyboard Active">⌨️</span>
                </div>
              </div>

              <div className="login-input-group">
                <label htmlFor="examTime">Exam Duration (Minutes)</label>
                <input 
                  type="number" 
                  id="examTime" 
                  value={examTime} 
                  onChange={(e) => setExamTime(Math.max(1, parseInt(e.target.value) || ''))}
                  min="1"
                  required
                />
              </div>

              {/* Mock Virtual Keyboard */}
              <div className="login-virtual-keyboard">
                <div className="login-kbd-header">Virtual Keyboard</div>
                <div className="login-kbd-grid">
                  {keyboardKeys.map((key) => (
                    <button 
                      key={key} 
                      type="button" 
                      className={`login-kbd-key ${key.length > 1 ? 'large' : ''}`}
                      onClick={() => {
                        if (key === 'Clear') setPassword('');
                        else if (key === 'Del') setPassword(p => p.slice(0, -1));
                        else setPassword(p => (p === '••••••••' ? key : p + key));
                      }}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side: Photo & Name */}
            <div className="login-body-right">
              <div className="login-avatar-container">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="login-candidate-name">
                <span className="label">Candidate Name:</span>
                <span className="name">Demo Candidate</span>
              </div>
              <div className="login-instructions">
                <p>Please verify your name and picture. Enter your credentials or use the virtual keyboard to sign in to your test console.</p>
              </div>
            </div>
          </div>

          <div className="login-card-footer">
            <button type="submit" className="cbt-btn cbt-btn-primary login-submit-btn">
              Sign In
            </button>
          </div>
        </form>
      </div>

      {/* Footer Banner */}
      <footer className="login-footer">
        <p>© TCS iON Practice Simulator. All rights reserved.</p>
      </footer>
    </div>
  );
}
