import React from 'react';
import { useExamState } from '../../context/ExamStateContext';

export default function QuestionPalette({ isCollapsed, onToggle }) {
  const { state, dispatch } = useExamState();
  const qIds = state.sections[state.currentSection]?.questionIds || [];

  const handleTileClick = (qId) => {
    dispatch({
      type: 'NAVIGATE_QUESTION',
      payload: { questionId: qId }
    });
  };

  const getTileClass = (status) => {
    switch (status) {
      case 'answered': return 'cbt-tile-answered';
      case 'not_answered': return 'cbt-tile-not-answered';
      case 'marked': return 'cbt-tile-marked';
      case 'answered_marked': return 'cbt-tile-answered-marked';
      case 'not_visited':
      default:
        return 'cbt-tile-not-visited';
    }
  };

  // Group questions into blocks of 10
  const blocks = [];
  for (let i = 0; i < qIds.length; i += 10) {
    blocks.push(qIds.slice(i, i + 10));
  }

  const activeIndex = qIds.indexOf(state.activeQuestionId);
  const currentBlockIndex = Math.floor(activeIndex / 10);

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
          <div className="cbt-palette-header">
            <h3>Question Palette</h3>
            <span className="cbt-palette-sec-title">{state.currentSection || 'No Section'}</span>
          </div>

          <div className="cbt-palette-blocks-container">
            {blocks.map((blockQIds, blockIdx) => {
              const startNum = blockIdx * 10 + 1;
              const endNum = startNum + blockQIds.length - 1;
              const isCurrentBlock = blockIdx === currentBlockIndex;

              return (
                <div 
                  key={blockIdx} 
                  className={`cbt-palette-block ${isCurrentBlock ? 'cbt-palette-block-active' : ''}`}
                >
                  <div className="cbt-palette-block-header">
                    Questions {startNum} - {endNum}
                  </div>
                  <div className="cbt-palette-grid">
                    {blockQIds.map((qId) => {
                      const q = state.questionsById[qId];
                      const globalIndex = qIds.indexOf(qId);
                      const displayNum = globalIndex + 1;
                      const isActive = qId === state.activeQuestionId;

                      return (
                        <button
                          key={qId}
                          className={`cbt-palette-tile ${getTileClass(q.status)} ${isActive ? 'cbt-palette-tile-active' : ''}`}
                          onClick={() => handleTileClick(qId)}
                          title={`Marks: ${q.marks}`}
                        >
                          <span className="cbt-tile-number">{displayNum}</span>
                          {q.status === 'answered_marked' && <span className="cbt-tile-dot"></span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
            {qIds.length === 0 && (
              <div className="cbt-palette-empty">No questions generated yet.</div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
