import React from 'react';
import { useExamState } from '../../context/ExamStateContext';

export default function QuestionPalette({ isCollapsed, onToggle, onSubmit }) {
  const { state, dispatch } = useExamState();
  const qIds = state.sections[state.currentSection]?.questionIds || [];

  const handleTileClick = (qId) => {
    dispatch({
      type: 'NAVIGATE_QUESTION',
      payload: { questionId: qId }
    });
  };

  const renderTileSvg = (status, isActive) => {
    if (status === 'answered') {
      // Pentagon pointing down (green)
      return (
        <svg className="cbt-tile-svg" viewBox="0 0 100 100">
          <path 
            d="M 6 6 L 94 6 L 94 66 L 50 94 L 6 66 Z" 
            fill="#38a169" 
            stroke={isActive ? '#3182ce' : 'none'} 
            strokeWidth={isActive ? '8' : '0'}
          />
        </svg>
      );
    } else if (status === 'not_answered') {
      // Pentagon pointing up (red)
      return (
        <svg className="cbt-tile-svg" viewBox="0 0 100 100">
          <path 
            d="M 50 6 L 94 36 L 94 94 L 6 94 L 6 36 Z" 
            fill="#e53e3e" 
            stroke={isActive ? '#3182ce' : 'none'} 
            strokeWidth={isActive ? '8' : '0'}
          />
        </svg>
      );
    } else if (status === 'marked') {
      // Circle (purple)
      return (
        <svg className="cbt-tile-svg" viewBox="0 0 100 100">
          <circle 
            cx="50" 
            cy="50" 
            r="44" 
            fill="#805ad5" 
            stroke={isActive ? '#3182ce' : 'none'} 
            strokeWidth={isActive ? '8' : '0'}
          />
        </svg>
      );
    } else if (status === 'answered_marked') {
      // Circle (purple) with green tick
      return (
        <svg className="cbt-tile-svg" viewBox="0 0 100 100">
          <circle 
            cx="50" 
            cy="50" 
            r="44" 
            fill="#805ad5" 
            stroke={isActive ? '#3182ce' : 'none'} 
            strokeWidth={isActive ? '8' : '0'}
          />
          <circle cx="80" cy="80" r="14" fill="#38a169" stroke="#ffffff" strokeWidth="2" />
          <path d="M 75 80 L 78 83 L 85 76" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    } else {
      // Not Visited (grey rounded square)
      return (
        <svg className="cbt-tile-svg" viewBox="0 0 100 100">
          <rect 
            x="6" 
            y="6" 
            width="88" 
            height="88" 
            rx="12" 
            ry="12" 
            fill="#e2e8f0" 
            stroke={isActive ? '#3182ce' : '#cbd5e1'} 
            strokeWidth={isActive ? '8' : '2'}
          />
        </svg>
      );
    }
  };

  const questions = Object.values(state.questionsById);
  const counts = {
    answered: 0,
    not_answered: 0,
    not_visited: 0,
    marked: 0,
    answered_marked: 0
  };

  questions.forEach(q => {
    if (q.section === state.currentSection) {
      if (q.status === 'answered') counts.answered++;
      else if (q.status === 'not_answered') counts.not_answered++;
      else if (q.status === 'marked') counts.marked++;
      else if (q.status === 'answered_marked') counts.answered_marked++;
      else counts.not_visited++;
    }
  });

  return (
    <aside className={`cbt-palette-sidebar ${isCollapsed ? 'cbt-palette-collapsed' : ''}`}>
      <button 
        className="cbt-palette-toggle-btn" 
        onClick={onToggle}
        title={isCollapsed ? "Expand Palette" : "Collapse Palette"}
      >
        {isCollapsed ? '◀' : '▶'}
      </button>
      
      {!isCollapsed && (
        <div className="cbt-palette-content">
          {/* Legend Grid Panel */}
          <div className="cbt-sidebar-legend">
            <div className="legend-grid-row">
              <div className="legend-grid-item">
                <div className="legend-shape answered">{counts.answered}</div>
                <span className="legend-label">Answered</span>
              </div>
              <div className="legend-grid-item">
                <div className="legend-shape not-answered">{counts.not_answered}</div>
                <span className="legend-label">Not Answered</span>
              </div>
            </div>
            <div className="legend-grid-row">
              <div className="legend-grid-item">
                <div className="legend-shape not-visited">{counts.not_visited}</div>
                <span className="legend-label">Not Visited</span>
              </div>
              <div className="legend-grid-item">
                <div className="legend-shape marked">{counts.marked}</div>
                <span className="legend-label">Marked for Review</span>
              </div>
            </div>
            <div className="legend-grid-row">
              <div className="legend-grid-item full-width">
                <div className="legend-shape answered-marked">{counts.answered_marked}</div>
                <span className="legend-label label-small">Answered & Marked for Review (will not be considered for evaluation)</span>
              </div>
            </div>
          </div>

          {/* Truncated active section banner */}
          <div className="cbt-sidebar-section-banner">
            <span>{state.currentSection || 'Write an Effective Ema...'}</span>
          </div>

          {/* Choose a Question & Grid */}
          <div className="cbt-choose-question-section">
            <div className="cbt-palette-header">
              <h3>Choose a Question</h3>
            </div>

            <div className="cbt-palette-grid-container">
              <div className="cbt-palette-grid">
                {qIds.map((qId, index) => {
                  const q = state.questionsById[qId];
                  const displayNum = index + 1;
                  const isActive = qId === state.activeQuestionId;

                  return (
                    <button
                      key={qId}
                      className={`cbt-palette-tile-svg-wrapper ${isActive ? 'active' : ''}`}
                      onClick={() => handleTileClick(qId)}
                      title={`Marks: ${q.marks}`}
                    >
                      {renderTileSvg(q.status, isActive)}
                      <span 
                        className="cbt-tile-number-svg"
                        style={{ color: q.status === 'not_visited' ? '#334155' : '#ffffff' }}
                      >
                        {displayNum}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {qIds.length === 0 && (
              <div className="cbt-palette-empty">No questions generated yet.</div>
            )}
          </div>

          {/* Sidebar Footer containing Submit */}
          <div className="cbt-sidebar-footer">
            <button className="cbt-btn-submit-sidebar" onClick={onSubmit}>
              Submit
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
