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
      <div className="cbt-legend">
        <div className="cbt-legend-item">
          <span className="cbt-legend-tile cbt-tile-answered">0</span>
          <span>Answered</span>
        </div>
        <div className="cbt-legend-item">
          <span className="cbt-legend-tile cbt-tile-not-answered">0</span>
          <span>Not Answered</span>
        </div>
        <div className="cbt-legend-item">
          <span className="cbt-legend-tile cbt-tile-not-visited">0</span>
          <span>Not Visited</span>
        </div>
        <div className="cbt-legend-item">
          <span className="cbt-legend-tile cbt-tile-marked">0</span>
          <span>Marked for Review</span>
        </div>
        <div className="cbt-legend-item">
          <span className="cbt-legend-tile cbt-tile-answered-marked">
            0<span className="cbt-tile-dot"></span>
          </span>
          <span style={{ fontSize: '10px' }}>Answered & Marked for Review</span>
        </div>
      </div>

      <div className="cbt-footer-actions">
        <div className="cbt-footer-left-btns">
          <button className="cbt-btn cbt-btn-secondary" onClick={handleClear}>
            Clear Response
          </button>
          <button className="cbt-btn cbt-btn-purple" onClick={handleMarkReviewNext}>
            Mark for Review & Next
          </button>
        </div>
        <div className="cbt-footer-right-btns">
          <button 
            className="cbt-btn cbt-btn-secondary" 
            onClick={handlePrevious}
            disabled={isFirstQuestion}
          >
            ◀ Back
          </button>
          <button className="cbt-btn cbt-btn-primary" onClick={handleSaveNext}>
            Save & Next ▶
          </button>
          <button className="cbt-btn cbt-btn-submit" onClick={onSubmit}>
            Submit
          </button>
        </div>
      </div>
    </footer>
  );
}
