import React from 'react';
import { useExamState } from '../../context/ExamStateContext';

export default function FooterControls({ onSubmit }) {
  const { state, dispatch } = useExamState();
  const qIds = state.sections[state.currentSection]?.questionIds || [];

  if (qIds.length === 0) return null;

  const activeIndex = qIds.indexOf(state.activeQuestionId);
  const isFirstQuestion = activeIndex === 0;
  const isLastQuestion = activeIndex === qIds.length - 1;

  const handleClear = () => {
    dispatch({ type: 'CLEAR_RESPONSE' });
  };

  const handleSaveNext = () => {
    dispatch({ type: 'SAVE_NEXT' });
  };

  const handleMarkReviewNext = () => {
    dispatch({ type: 'MARK_REVIEW_NEXT' });
  };

  const handlePrevious = () => {
    dispatch({ type: 'NAVIGATE_PREV' });
  };

  return (
    <footer className="cbt-footer">
      <div className="cbt-footer-actions">
        <div className="cbt-footer-left-btns">
          <button className="cbt-btn cbt-btn-secondary footer-btn-white" onClick={handleMarkReviewNext}>
            Mark for Review & Next
          </button>
          <button className="cbt-btn cbt-btn-secondary footer-btn-white" onClick={handleClear}>
            Clear Response
          </button>
        </div>
        <div className="cbt-footer-right-btns">
          <button 
            className="cbt-btn cbt-btn-secondary footer-btn-white" 
            onClick={handlePrevious}
            disabled={isFirstQuestion}
            style={{ marginRight: '10px' }}
          >
            Previous
          </button>
          <button className="cbt-btn cbt-btn-primary footer-btn-blue" onClick={handleSaveNext}>
            Save & Next
          </button>
        </div>
      </div>
    </footer>
  );
}
