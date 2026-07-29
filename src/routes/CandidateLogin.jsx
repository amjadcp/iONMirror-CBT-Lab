import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { setPersistentSessionId } from '../utils/session';

export default function CandidateLogin() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const timeQuery = searchParams.get('time');
  
  const [candidateId, setCandidateId] = useState('');
  const [password, setPassword] = useState('');
  const [requiredPassword, setRequiredPassword] = useState('');
  const [examTime, setExamTime] = useState(timeQuery ? parseInt(timeQuery, 10) : 10);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (timeQuery) {
      setExamTime(parseInt(timeQuery, 10));
    }
  }, [timeQuery]);

  // Sync persistent session ID in browser storage
  useEffect(() => {
    if (sessionId) {
      setPersistentSessionId(sessionId);
    }
  }, [sessionId]);

  // Generate random candidate ID and random numeric system password (e.g. 4-digit number)
  useEffect(() => {
    const randomId = Math.floor(10000000 + Math.random() * 90000000).toString();
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setCandidateId(randomId);
    setRequiredPassword(randomPin);
  }, []);

  const handleSignIn = (e) => {
    e.preventDefault();
    if (password.trim() !== requiredPassword) {
      setErrorMessage(`Invalid Password! Please enter the system password (${requiredPassword}) displayed on screen.`);
      return;
    }
    setErrorMessage('');
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
        <form onSubmit={handleSignIn} className="login-card" autoComplete="off">
          <div className="login-card-header">
            <h3>Login Details</h3>
          </div>
          
          <div className="login-card-body">
            {/* Left side: Inputs & Keyboard */}
            <div className="login-body-left">
              {errorMessage && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fca5a5',
                  color: '#991b1b',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  marginBottom: '15px',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}>
                  ⚠️ {errorMessage}
                </div>
              )}

              <div className="login-input-group">
                <label htmlFor="userId">Candidate ID</label>
                <input 
                  type="text" 
                  id="userId" 
                  name="cbt_user_id"
                  autoComplete="off"
                  value={candidateId} 
                  onChange={(e) => setCandidateId(e.target.value)} 
                  required
                />
              </div>

              <div className="login-input-group">
                <label htmlFor="password">
                  Password <span style={{ color: '#0284c7', fontSize: '12px', fontWeight: 'bold' }}>(System Password: {requiredPassword})</span>
                </label>
                <div className="login-pwd-wrapper">
                  <input 
                    type="text" 
                    id="password" 
                    name="cbt_candidate_pin"
                    autoComplete="off"
                    style={{ WebkitTextSecurity: 'disc' }}
                    value={password} 
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Enter password"
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
                        setErrorMessage('');
                        if (key === 'Clear') setPassword('');
                        else if (key === 'Del') setPassword(p => p.slice(0, -1));
                        else setPassword(p => p + key);
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
                <p style={{ marginBottom: '8px' }}>Please verify your name and picture.</p>
                <div style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  marginTop: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '600', marginBottom: '4px' }}>
                    🔑 SYSTEM LOGIN PASSWORD
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e3a8a', letterSpacing: '4px', fontFamily: 'monospace' }}>
                    {requiredPassword || '1234'}
                  </div>
                </div>
                <p style={{ marginTop: '10px', fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
                  Enter the password shown above using your physical keyboard or virtual keyboard to sign in.
                </p>
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
