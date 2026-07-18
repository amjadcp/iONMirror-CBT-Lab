import React, { useRef, useEffect, useState } from 'react';
import { useExamState } from '../../context/ExamStateContext';
import MarkdownRenderer from './MarkdownRenderer';

export default function QuestionPane() {
  const { state, dispatch } = useExamState();
  const scrollContainerRef = useRef(null);
  const [modalSvgContent, setModalSvgContent] = useState(null);

  const activeQId = state.activeQuestionId;
  const activeQ = state.questionsById[activeQId];

  // Restrict mouse wheel scroll inside the main question scrolling container
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const preventScroll = (e) => {
      e.preventDefault();
    };

    scrollContainer.addEventListener('wheel', preventScroll, { passive: false });
    return () => {
      scrollContainer.removeEventListener('wheel', preventScroll);
    };
  }, [activeQId]);

  if (!activeQ) {
    return (
      <div className="cbt-question-pane-empty">
        <div className="cbt-question-pane-empty-card">
          <h2>No Question Selected</h2>
          <p>Configure and generate questions in the side panel to begin your practice exam.</p>
        </div>
      </div>
    );
  }

  const qIds = state.sections[state.currentSection]?.questionIds || [];
  const secIndex = qIds.indexOf(activeQId) + 1;

  const handleOptionChange = (optionId) => {
    let newSelected = [...(activeQ.selected || [])];
    if (activeQ.type === 'multiple') {
      if (newSelected.includes(optionId)) {
        newSelected = newSelected.filter(id => id !== optionId);
      } else {
        newSelected.push(optionId);
      }
    } else {
      newSelected = [optionId];
    }

    dispatch({
      type: 'SELECT_OPTION',
      payload: { selected: newSelected }
    });
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  // Handles click to enlarge on rendered SVGs (Mermaid charts or inline SVGs)
  const handlePaneClick = (e) => {
    const svgEl = e.target.closest('.mermaid-block svg') || e.target.closest('svg');
    // Ensure we do not enlarge the candidate avatar or timer/layout SVGs
    if (svgEl && !e.target.closest('.cbt-candidate-info') && !e.target.closest('.cbt-avatar')) {
      setModalSvgContent(svgEl.outerHTML);
    }
  };

  return (
    <div className="cbt-question-pane" onClick={handlePaneClick}>
      <div className="cbt-question-pane-header">
        <div className="cbt-question-info-left">
          <span className="cbt-question-number">Question No. {secIndex}</span>
          <span className="cbt-question-type">
            Type: {activeQ.type === 'multiple' ? 'Multiple Correct (MSQ)' : 'Single Correct (MCQ)'}
          </span>
        </div>
        <div className="cbt-question-info-right">
          <span className="cbt-marks-badge positive">Marks: +{activeQ.marks}</span>
          {activeQ.negativeMarks ? (
            <span className="cbt-marks-badge negative">Negative: -{activeQ.negativeMarks}</span>
          ) : null}
        </div>
      </div>

      <div className="cbt-question-scroll-controls">
        <button onClick={scrollToTop} className="cbt-scroll-btn top" title="Scroll to Top">▲ Top</button>
        <button onClick={scrollToBottom} className="cbt-scroll-btn bottom" title="Scroll to Bottom">▼ Bottom</button>
      </div>

      <div className="cbt-question-content-container" ref={scrollContainerRef}>
        <div className="cbt-question-stem">
          <MarkdownRenderer content={activeQ.stemMarkdown} />
        </div>

        <div className="cbt-question-options">
          {activeQ.options.map((opt) => {
            const isSelected = (activeQ.selected || []).includes(opt.id);
            const inputId = `opt_${activeQId}_${opt.id}`;

            return (
              <label 
                key={opt.id} 
                htmlFor={inputId} 
                className={`cbt-option-wrapper ${isSelected ? 'cbt-option-selected' : ''}`}
              >
                <div className="cbt-option-input-container">
                  <input
                    type={activeQ.type === 'multiple' ? 'checkbox' : 'radio'}
                    id={inputId}
                    name={`question_${activeQId}`}
                    checked={isSelected}
                    onChange={() => handleOptionChange(opt.id)}
                  />
                  <span className="cbt-option-letter">{opt.id.toUpperCase()}.</span>
                </div>
                <div className="cbt-option-text">
                  <MarkdownRenderer content={opt.markdown} />
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {modalSvgContent && (
        <div className="cbt-enlarge-modal-overlay" onClick={() => setModalSvgContent(null)}>
          <div className="cbt-enlarge-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="cbt-enlarge-modal-close" onClick={() => setModalSvgContent(null)}>×</button>
            <div 
              className="cbt-enlarge-modal-body"
              dangerouslySetInnerHTML={{ __html: modalSvgContent }}
            />
            <div className="cbt-enlarge-modal-caption">Click-to-Enlarge Diagram View (Click outside to close)</div>
          </div>
        </div>
      )}
    </div>
  );
}
