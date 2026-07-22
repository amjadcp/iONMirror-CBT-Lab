import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExamStateProvider, useExamState } from '../context/ExamStateContext';
import { setPersistentSessionId } from '../utils/session';

function GeneratorPageContent() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useExamState();

  const [checking, setChecking] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync session ID with browser storage
  useEffect(() => {
    if (sessionId) {
      setPersistentSessionId(sessionId);
    }
  }, [sessionId]);

  const webhookUrl = `${window.location.origin}/api/webhook/${sessionId}`;
  const loginUrl = `${window.location.origin}/session/${sessionId}/login`;
  const redirectUrl = `https://ais-pre-ypbuzox4vixovq227yoe2x-710190054976.asia-southeast1.run.app?webhook=${encodeURIComponent(webhookUrl)}&redirect=${encodeURIComponent(loginUrl)}`;

  // Sync state and check if questions are already present in store
  useEffect(() => {
    const checkQuestionsOnMount = async () => {
      try {
        const res = await fetch(`/api/poll/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.questions && data.questions.length > 0) {
            // Questions exist! Dispatch to context store so the exam is pre-populated
            dispatch({
              type: 'LOAD_QUESTIONS',
              payload: { 
                questions: data.questions, 
                examType: data.examType || 'Practice' 
              }
            });
            setChecking(false);
            return;
          }
        }
      } catch (err) {
        console.error("Error verifying existing questions on mount:", err);
      }

      // No questions exist yet: Prepare to redirect browser to AI website
      setRedirecting(true);
      setChecking(false);
      
      const timer = setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1000);

      return () => clearTimeout(timer);
    };

    if (sessionId) {
      checkQuestionsOnMount();
    }
  }, [sessionId, redirectUrl, dispatch]);

  const handleProceed = () => {
    navigate(`/session/${sessionId}/login`);
  };

  const questionsCount = Object.keys(state.questionsById).length;

  return (
    <div className="setup-container" style={{ minHeight: '100vh', background: '#edf2f7' }}>
      <div className="setup-card" style={{ maxWidth: '460px', padding: '30px', textAlign: 'center' }}>
        <h2 className="setup-title" style={{ marginBottom: '15px' }}>
          Quiz Generator Portal
        </h2>

        {checking && (
          <div style={{ padding: '20px 0' }}>
            <div className="cbt-loading-spinner" style={{ margin: '0 auto 15px' }}></div>
            <p className="setup-desc">Verifying session questions status...</p>
          </div>
        )}

        {!checking && redirecting && (
          <div>
            <div className="cbt-loading-spinner" style={{ margin: '0 auto 15px' }}></div>
            <p className="setup-desc" style={{ fontWeight: '700', color: 'var(--cbt-steel-blue)' }}>
              Redirecting you to the AI generator website...
            </p>
            <p className="setup-desc" style={{ fontSize: '11.5px', marginTop: '10px' }}>
              We are connecting you to the AI console to build your custom mock exam.
            </p>
            <a 
              href={redirectUrl} 
              className="cbt-btn cbt-btn-primary" 
              style={{ display: 'inline-block', marginTop: '20px', textDecoration: 'none' }}
            >
              Click here if not redirected automatically
            </a>
          </div>
        )}

        {!checking && !redirecting && (
          <div>
            <div 
              style={{
                background: '#f0fff4',
                border: '1px solid #c6f6d5',
                borderRadius: '6px',
                padding: '16px',
                color: '#22543d',
                fontSize: '12.5px',
                lineHeight: '1.6',
                marginBottom: '20px',
                textAlign: 'left'
              }}
            >
              <strong>✓ Questions Loaded Successfully!</strong>
              <p style={{ marginTop: '5px', fontSize: '11.5px', color: '#2f855a' }}>
                Found {questionsCount} questions configured for this practice session. You are ready to log in.
              </p>
            </div>

            <button 
              className="cbt-btn cbt-btn-primary setup-btn" 
              onClick={handleProceed}
              style={{ background: '#38a169', borderColor: '#2f855a', width: '100%' }}
            >
              Proceed to Candidate Login ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GeneratorPage() {
  return (
    <ExamStateProvider>
      <GeneratorPageContent />
    </ExamStateProvider>
  );
}
