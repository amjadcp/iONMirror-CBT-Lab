import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExamStateProvider, useExamState } from '../context/ExamStateContext';
import { useSessionPolling } from '../hooks/useSessionPolling';
import { useExamTimer } from '../hooks/useExamTimer';

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
  
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Initialize session state on mount or change
  useEffect(() => {
    if (state.sessionId !== sessionId) {
      dispatch({
        type: 'INIT_SESSION',
        payload: { sessionId, durationSeconds: 1800 } // 30 minutes duration
      });
    }
  }, [sessionId, state.sessionId, dispatch]);

  // Bind session polling and timer hooks
  useSessionPolling(sessionId, state.submission.submitted, dispatch);
  useExamTimer(state.timer, dispatch);

  // Auto-start timer on question arrival
  useEffect(() => {
    const hasQuestions = Object.keys(state.questionsById).length > 0;
    if (hasQuestions && !state.timer.isRunning && !state.timer.isExpired && !state.submission.submitted) {
      dispatch({ type: 'START_TIMER' });
    }
  }, [state.questionsById, state.timer.isRunning, state.timer.isExpired, state.submission.submitted, dispatch]);

  const handleConfirmSubmit = () => {
    setIsSubmitModalOpen(false);
    dispatch({ type: 'SUBMIT_EXAM' });
  };

  const handleRestart = () => {
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
