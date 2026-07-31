import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_TESTS } from '../data/mockTests';
import { trackEvent } from '../utils/analytics';
import { parseQuestionsFromRaw } from '../utils/questionParser';
import { fetchGitHubMockTests } from '../utils/githubService';

export default function MockTestSelection() {
  const navigate = useNavigate();
  const [githubTests, setGithubTests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize showAiPopup based on localStorage persistence
  const [showAiPopup, setShowAiPopup] = useState(() => {
    return localStorage.getItem('ionmirror_ai_popup_dismissed') !== 'true';
  });

  useEffect(() => {
    async function loadRepoTests() {
      setLoading(true);
      const tests = await fetchGitHubMockTests();
      setGithubTests(tests);
      setLoading(false);
    }
    loadRepoTests();
  }, []);

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
    trackEvent('select_mock_test', 'engagement', test.id || test.title);

    // Clear previous exam state flags for this session ID
    sessionStorage.removeItem(`ion_exam_active_${sessionId}`);
    sessionStorage.removeItem(`ion_warning_count_${sessionId}`);
    sessionStorage.removeItem(`ion_exam_terminated_${sessionId}`);
    sessionStorage.removeItem(`ion_last_warning_trigger_${sessionId}`);

    let rawQuestionsInput = test.questions;

    // If test is fetched from GitHub repository, fetch raw markdown content live in browser
    if (test.downloadUrl) {
      try {
        const res = await fetch(test.downloadUrl);
        if (res.ok) {
          rawQuestionsInput = await res.text();
        }
      } catch (err) {
        console.error('Error fetching raw markdown from GitHub:', err);
      }
    }

    // Parse questions using standard common parser purely in the browser
    const { questions: parsedQuestions, metadata } = parseQuestionsFromRaw(rawQuestionsInput);

    const durationMins = (metadata && metadata.durationMins) || test.durationMins || 10;

    const examName = test.fileName || test.title || 'Mock Test';
    sessionStorage.setItem(`ion_exam_name_${sessionId}`, examName);

    // Store in browser sessionStorage (No Netlify Blob API call!)
    sessionStorage.setItem(`ion_client_questions_${sessionId}`, JSON.stringify(parsedQuestions));

    // Navigate to candidate login with selected test duration
    navigate(`/session/${sessionId}/login?time=${durationMins}`);
  };

  const handleGenerateWithAI = () => {
    const sessionId = getSessionId();
    trackEvent('start_ai_generator', 'engagement', 'mock_selection_popup');
    navigate(`/session/${sessionId}/generate`);
  };

  // Display ONLY GitHub repo test files if available; fallback to MOCK_TESTS if empty
  const displayTests = githubTests.length > 0 ? githubTests : MOCK_TESTS;

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
        {loading ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--cbt-steel-blue)' }}>
            <div className="cbt-loading-spinner" style={{ margin: '0 auto 15px' }}></div>
            <p>Fetching practice test papers...</p>
          </div>
        ) : (
          /* Mock Tests Hyperlink Bulleted List */
          <ul className="mock-links-list">
            {displayTests.map(test => (
              <li className="mock-link-bullet-item" key={test.id || test.fileName || test.title}>
                <a 
                  href="#"
                  className="mock-link-anchor"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelectMockTest(test);
                  }}
                >
                  {test.fileName ? test.fileName.replace(/\.[^/.]+$/, '') : `${test.title} | ${test.questionsCount} Questions | ${test.durationMins} mins.`}
                </a>
              </li>
            ))}
          </ul>
        )}
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
