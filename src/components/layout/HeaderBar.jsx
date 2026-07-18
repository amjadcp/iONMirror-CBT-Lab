import React, { useState } from 'react';
import { useExamState } from '../../context/ExamStateContext';

export default function HeaderBar() {
  const { state } = useExamState();
  const { remainingSeconds } = state.timer;
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('English');

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [
      h.toString().padStart(2, '0'),
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0')
    ].join(':');
  };

  const isLowTime = remainingSeconds <= 300; // <= 5 minutes

  return (
    <header className="cbt-header">
      <div className="cbt-header-left">
        <h1 className="cbt-exam-name">TCS iON CBT Exam Simulator</h1>
      </div>
      <div className="cbt-header-right">
        <div className="cbt-timer-container">
          <span className="cbt-timer-label">Time Left:</span>
          <span className={`cbt-timer-val ${isLowTime ? 'cbt-timer-low' : ''}`}>
            {formatTime(remainingSeconds)}
          </span>
        </div>
        <div className="cbt-candidate-info" onClick={() => setLangDropdownOpen(!langDropdownOpen)}>
          <div className="cbt-candidate-text">
            <span className="cbt-candidate-name">Demo Candidate</span>
            <span className="cbt-candidate-id">Candidate ID: C001_Practice</span>
          </div>
          <div className="cbt-avatar">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          {langDropdownOpen && (
            <div className="cbt-lang-dropdown" onClick={(e) => e.stopPropagation()}>
              <div className="cbt-lang-header">Change Language</div>
              <div className="cbt-lang-option" onClick={() => { setSelectedLang('English'); setLangDropdownOpen(false); }}>English</div>
              <div className="cbt-lang-option" onClick={() => { setSelectedLang('Hindi'); setLangDropdownOpen(false); }}>Hindi</div>
              <div className="cbt-lang-selected">Current: {selectedLang}</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
