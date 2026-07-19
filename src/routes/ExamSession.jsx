import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ExamStateProvider, useExamState } from '../context/ExamStateContext';
import { useSessionPolling } from '../hooks/useSessionPolling';
import { useExamTimer } from '../hooks/useExamTimer';
import { trackEvent } from '../utils/analytics';

import HeaderBar from '../components/layout/HeaderBar';
import SectionTabs from '../components/layout/SectionTabs';
import QuestionPalette from '../components/layout/QuestionPalette';
import FooterControls from '../components/layout/FooterControls';
import QuestionPane from '../components/question/QuestionPane';
import SubmitConfirmModal from '../components/modals/SubmitConfirmModal';
import SummaryScreen from '../components/modals/SummaryScreen';

function ExamSessionContent() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useExamState();
  const [searchParams] = useSearchParams();

  const timeQuery = searchParams.get('time');
  const durationSeconds = timeQuery ? parseInt(timeQuery, 10) * 60 : 600; // default is 10 mins (600s)

  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [warningModal, setWarningModal] = useState({ isOpen: false, reason: '' });
  const [warnings, setWarnings] = useState(0);

  // Initialize session state on mount or change
  useEffect(() => {
    if (state.sessionId !== sessionId) {
      dispatch({
        type: 'INIT_SESSION',
        payload: { sessionId, durationSeconds }
      });
    }
  }, [sessionId, state.sessionId, dispatch, durationSeconds]);

  // Bind session polling and timer hooks
  useSessionPolling(sessionId, state.submission.submitted, dispatch);
  useExamTimer(state.timer, dispatch);

  // Sync state.submission.submitted to sessionStorage to keep track of status
  useEffect(() => {
    if (state.submission.submitted) {
      sessionStorage.setItem(`ion_exam_active_${sessionId}`, 'false');
    }
  }, [state.submission.submitted, sessionId]);

  // Detect reload/refresh on mount
  useEffect(() => {
    const isExamActive = sessionStorage.getItem(`ion_exam_active_${sessionId}`) === 'true';
    const isTerminated = sessionStorage.getItem(`ion_exam_terminated_${sessionId}`) === 'true';

    if (isExamActive && !isTerminated) {
      const currentWarnings = parseInt(sessionStorage.getItem(`ion_warning_count_${sessionId}`) || '0', 10);
      trackEvent('security_warning', 'violation', 'page refresh');
      if (currentWarnings === 0) {
        sessionStorage.setItem(`ion_warning_count_${sessionId}`, '1');
        setWarnings(1);
        setWarningModal({
          isOpen: true,
          reason: 'page refresh'
        });
      } else {
        trackEvent('security_termination', 'violation', sessionId);
        sessionStorage.setItem(`ion_exam_terminated_${sessionId}`, 'true');
      }
    }
  }, [sessionId]);

  // Prevent refresh/unload browser warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const isExamActive = sessionStorage.getItem(`ion_exam_active_${sessionId}`) === 'true';
      const isTerminated = sessionStorage.getItem(`ion_exam_terminated_${sessionId}`) === 'true';
      if (isExamActive && !isTerminated) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId]);

  // Listen to tab and window switching (blur/visibilitychange)
  useEffect(() => {
    const triggerWarning = (reason) => {
      const isExamActive = sessionStorage.getItem(`ion_exam_active_${sessionId}`) === 'true';
      const isTerminated = sessionStorage.getItem(`ion_exam_terminated_${sessionId}`) === 'true';
      if (!isExamActive || isTerminated || state.submission.submitted) return;

      const lastTrigger = sessionStorage.getItem(`ion_last_warning_trigger_${sessionId}`);
      const now = Date.now();
      if (lastTrigger && now - parseInt(lastTrigger, 10) < 1500) {
        return;
      }
      sessionStorage.setItem(`ion_last_warning_trigger_${sessionId}`, now.toString());

      const currentWarnings = parseInt(sessionStorage.getItem(`ion_warning_count_${sessionId}`) || '0', 10);
      trackEvent('security_warning', 'violation', reason === 'tab' ? 'tab switching' : 'window switching');
      if (currentWarnings === 0) {
        sessionStorage.setItem(`ion_warning_count_${sessionId}`, '1');
        setWarnings(1);
        setWarningModal({
          isOpen: true,
          reason: reason === 'tab' ? 'tab switching' : 'window switching'
        });
      } else {
        trackEvent('security_termination', 'violation', sessionId);
        sessionStorage.setItem(`ion_exam_terminated_${sessionId}`, 'true');
        dispatch({ type: 'SUBMIT_EXAM' });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerWarning('tab');
      }
    };

    const handleBlur = () => {
      triggerWarning('window');
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionId, state.submission.submitted, dispatch]);

  // Auto-start or auto-terminate timer on question arrival
  useEffect(() => {
    const hasQuestions = Object.keys(state.questionsById).length > 0;
    if (hasQuestions) {
      const isTerminated = sessionStorage.getItem(`ion_exam_terminated_${sessionId}`) === 'true';
      if (isTerminated) {
        if (!state.submission.submitted) {
          dispatch({ type: 'SUBMIT_EXAM' });
        }
      } else {
        if (!state.timer.isRunning && !state.timer.isExpired && !state.submission.submitted) {
          dispatch({ type: 'START_TIMER' });
          if (!sessionStorage.getItem(`ion_exam_active_${sessionId}`)) {
            trackEvent('questions_loaded', 'exam', sessionId, Object.keys(state.questionsById).length);
            sessionStorage.setItem(`ion_exam_active_${sessionId}`, 'true');
            sessionStorage.setItem(`ion_warning_count_${sessionId}`, '0');
          }
        }
      }
    }
  }, [state.questionsById, state.timer.isRunning, state.timer.isExpired, state.submission.submitted, sessionId, dispatch]);

  const handleConfirmSubmit = () => {
    setIsSubmitModalOpen(false);
    trackEvent('exam_submitted', 'exam', 'user_confirmed');
    dispatch({ type: 'SUBMIT_EXAM' });
  };

  const handleRestart = () => {
    trackEvent('restart_session', 'engagement', sessionId);
    sessionStorage.removeItem(`ion_exam_active_${sessionId}`);
    sessionStorage.removeItem(`ion_warning_count_${sessionId}`);
    sessionStorage.removeItem(`ion_exam_terminated_${sessionId}`);
    sessionStorage.removeItem(`ion_last_warning_trigger_${sessionId}`);
    dispatch({ type: 'RESET_SESSION' });
    navigate('/');
  };

  const clearAlert = () => {
    dispatch({ type: 'CLEAR_ARRIVED_ALERT' });
  };

  if (state.submission.submitted) {
    return <SummaryScreen onRestart={handleRestart} />;
  }

  return (
    <div className="cbt-exam-full-width-container">
      {/* Main restrictive TCS iON style exam window */}
      {state.newQuestionsArrived && (
        <div className="cbt-arrived-alert">
          <span className="alert-text">
            🚀 Questions successfully added to your session based on settings!
          </span>
          <button className="alert-close" onClick={clearAlert}>×</button>
        </div>
      )}

      <div className="cbt-exam-wrapper">
        <HeaderBar />
        <SectionTabs />
        
        <div className="cbt-exam-body">
          <QuestionPane />
          <QuestionPalette 
            isCollapsed={isPaletteCollapsed} 
            onToggle={() => setIsPaletteCollapsed(!isPaletteCollapsed)} 
            onSubmit={() => setIsSubmitModalOpen(true)}
          />
        </div>

        <FooterControls onSubmit={() => setIsSubmitModalOpen(true)} />
      </div>

      <SubmitConfirmModal 
        isOpen={isSubmitModalOpen}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setIsSubmitModalOpen(false)}
      />

      {warningModal.isOpen && (
        <div className="cbt-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="cbt-modal-container" style={{ borderColor: '#e53e3e' }}>
            <div className="cbt-modal-header" style={{ background: '#fed7d7', borderBottomColor: '#feb2b2' }}>
              <h3 style={{ color: '#c53030' }}>⚠️ Security Warning</h3>
            </div>
            <div className="cbt-modal-body" style={{ fontSize: '13px', padding: '24px 20px' }}>
              <p style={{ fontWeight: 'bold', color: '#c53030', marginBottom: '12px' }}>
                First Warning: Unallowed navigation detected ({warningModal.reason}).
              </p>
              <p>
                You are not allowed to switch tabs, switch windows, or refresh the page during the exam.
              </p>
              <p style={{ marginTop: '10px', color: '#4a5568' }}>
                Any further tab/window switching or refreshing will <strong>terminate your exam immediately</strong> and lock your current answers.
              </p>
            </div>
            <div className="cbt-modal-footer" style={{ background: '#edf2f7', textAlign: 'right' }}>
              <button 
                className="cbt-btn cbt-btn-primary" 
                style={{ background: '#e53e3e', borderColor: '#c53030' }}
                onClick={() => setWarningModal({ isOpen: false, reason: '' })}
              >
                I Understand, Resume Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExamSession() {
  return (
    <ExamStateProvider>
      <ExamSessionContent />
    </ExamStateProvider>
  );
}
