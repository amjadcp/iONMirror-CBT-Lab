import React from 'react';
import { useExamState } from '../../context/ExamStateContext';

export default function SectionTabs() {
  const { state, dispatch } = useExamState();
  const sectionNames = Object.keys(state.sections);
  const { remainingSeconds } = state.timer;

  const handleSectionClick = (secName) => {
    const qIds = state.sections[secName]?.questionIds || [];
    if (qIds.length > 0) {
      dispatch({
        type: 'NAVIGATE_QUESTION',
        payload: { questionId: qIds[0] }
      });
    }
  };

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeQ = state.questionsById[state.activeQuestionId];
  const positiveMarks = activeQ?.marks || 1;
  const negativeMarks = activeQ?.negativeMarks || 0;

  if (sectionNames.length === 0) {
    return (
      <div className="cbt-section-tabs-placeholder">
        No active sections. Configure questions in the setup page.
      </div>
    );
  }

  return (
    <div className="cbt-section-tabs-container">
      {/* Row 1: Section Nav Buttons */}
      <div className="cbt-section-tabs-top">
        {sectionNames.map((secName) => {
          const isActive = state.currentSection === secName;
          return (
            <button
              key={secName}
              className={`cbt-sec-tab-btn-top ${isActive ? 'active' : ''}`}
              onClick={() => handleSectionClick(secName)}
            >
              <span className="tab-btn-text">{secName}</span>
              <span className="info-icon-bubble">i</span>
            </button>
          );
        })}
        <div className="chevron-right-indicator">▶</div>
      </div>

      {/* Row 2: Sub-sections & Timer */}
      <div className="cbt-section-tabs-bottom">
        <div className="sections-label-container">
          <span>Sections</span>
        </div>
        <div className="active-section-tab-container">
          <div className="cbt-sec-tab-btn-bottom">
            <span className="tab-btn-text">{state.currentSection}</span>
            <span className="info-icon-bubble">i</span>
          </div>
        </div>
        <div className="timer-container-align-right">
          <span className="timer-label-sections">Time Left : </span>
          <span className="timer-val-sections">{formatTime(remainingSeconds)}</span>
          <span className="chevron-right-indicator-small">▶</span>
        </div>
      </div>

      {/* Row 3: Marks Row */}
      <div className="cbt-marks-row">
        <span className="marks-info-text">
          Marks for correct answer <span className="marks-count-positive">{positiveMarks}</span> | Negative Marks <span className="marks-count-negative">{negativeMarks}</span>
        </span>
      </div>
    </div>
  );
}
