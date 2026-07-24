import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_TESTS } from '../data/mockTests';
import { trackEvent } from '../utils/analytics';

export default function MockTestSelection() {
  const navigate = useNavigate();

  // Initialize showAiPopup based on localStorage persistence
  const [showAiPopup, setShowAiPopup] = useState(() => {
    return localStorage.getItem('ionmirror_ai_popup_dismissed') !== 'true';
  });

  const handleClosePopup = () => {
    setShowAiPopup(false);
    localStorage.setItem('ionmirror_ai_popup_dismissed', 'true');
  };

  const handleOpenPopup = () => {
    setShowAiPopup(true);
    localStorage.removeItem('ionmirror_ai_popup_dismissed');
  };

  // Get or create persistent session ID from localStorage
  const getSessionId = () => {
    let sessionId = localStorage.getItem('ionmirror_persistent_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('ionmirror_persistent_session_id', sessionId);
    }
    return sessionId;
  };

  const handleSelectMockTest = async (test) => {
    const sessionId = getSessionId();
    trackEvent('select_mock_test', 'engagement', test.id);

    try {
      // Send mock test questions to session webhook endpoint
      await fetch(`/api/webhook/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: test.questions,
          examType: test.title
        })
      });
    } catch (e) {
      console.warn('Webhook dispatch failed, continuing to candidate login:', e);
    }

    // Navigate to candidate login with selected test duration
    navigate(`/session/${sessionId}/login?time=${test.durationMins}`);
  };

  const handleGenerateWithAI = () => {
    const sessionId = getSessionId();
    trackEvent('start_ai_generator', 'engagement', 'mock_selection_popup');
    navigate(`/session/${sessionId}/generate`);
  };

  return (
    <div className="mock-selection-wrapper">
      {/* Top Header */}
      <header className="mock-header">
        <div className="mock-header-content">
          <button className="back-link" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
          <h1>Computer-Based Test (CBT) Practice Catalog</h1>
          <p className="mock-header-desc">
            Select a practice test set below or use the AI Generator to create custom mock exams under TCS iON rules.
          </p>
        </div>
      </header>

      {/* Main Catalog Section */}
      <main className="mock-selection-container">
        
        {/* Mock Tests Hyperlink Bulleted List */}
        <ul className="mock-links-list">
          {MOCK_TESTS.map(test => (
            <li className="mock-link-bullet-item" key={test.id}>
              <a 
                href="#"
                className="mock-link-anchor"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectMockTest(test);
                }}
              >
                {test.title} | {test.questionsCount} Questions | {test.durationMins} mins.
              </a>
            </li>
          ))}
        </ul>

      </main>

      {/* Floating Bottom-Right AI Question Generator Overlay Popup */}
      {showAiPopup ? (
        <div className="ai-floating-popup">
          <button 
            className="ai-popup-close-btn" 
            onClick={handleClosePopup}
            title="Close popup"
            aria-label="Close popup"
          >
            ×
          </button>
          <div className="ai-popup-header">
            <span className="ai-popup-icon">🤖</span>
            <span className="ai-popup-title">AI Question Generator</span>
          </div>
          <p className="ai-popup-desc">
            Want custom questions for a specific exam or syllabus? Generate unlimited mock tests with AI.
          </p>
          <button 
            className="cbt-btn cbt-btn-primary ai-popup-btn" 
            onClick={handleGenerateWithAI}
          >
            Generate Custom Test with AI →
          </button>
        </div>
      ) : (
        <button 
          className="ai-circle-trigger-btn" 
          onClick={handleOpenPopup}
          title="Open AI Question Generator"
          aria-label="Open AI Question Generator"
        >
          🤖
        </button>
      )}
    </div>
  );
}
