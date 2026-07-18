import React from 'react';
import { useExamState } from '../../context/ExamStateContext';

export default function SectionTabs() {
  const { state, dispatch } = useExamState();
  const sectionNames = Object.keys(state.sections);

  const handleSectionClick = (secName) => {
    const qIds = state.sections[secName]?.questionIds || [];
    if (qIds.length > 0) {
      dispatch({
        type: 'NAVIGATE_QUESTION',
        payload: { questionId: qIds[0] }
      });
    }
  };

  if (sectionNames.length === 0) {
    return (
      <div className="cbt-section-tabs-placeholder">
        No active sections. Configure questions in the side panel.
      </div>
    );
  }

  return (
    <div className="cbt-section-tabs">
      {sectionNames.map((secName) => {
        const isActive = state.currentSection === secName;
        const qCount = state.sections[secName]?.questionIds?.length || 0;
        return (
          <button
            key={secName}
            className={`cbt-section-tab ${isActive ? 'cbt-section-tab-active' : ''}`}
            onClick={() => handleSectionClick(secName)}
          >
            {secName} ({qCount})
          </button>
        );
      })}
    </div>
  );
}
