import React from 'react';
import { useExamState } from '../../context/ExamStateContext';

export default function HeaderBar() {
  const { state } = useExamState();

  return (
    <header className="cbt-header">
      <div className="cbt-header-left">
        <h1 className="cbt-exam-name">{state.currentSection || 'Write an Effective Email'}</h1>
      </div>
      <div className="cbt-header-right">
        <button className="cbt-header-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
          </svg>
          Question Paper
        </button>
        <button className="cbt-header-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          View Instructions
        </button>
      </div>
    </header>
  );
}
