import React, { useState } from 'react';
import { useExamState } from '../../context/ExamStateContext';

export default function SummaryScreen({ onRestart }) {
  const { state } = useExamState();
  const { summary } = state.submission;
  const [showSolutions, setShowSolutions] = useState(false);

  if (!summary) return null;

  const notAttempted = summary.total - summary.answered - summary.marked - summary.answeredMarked;
  const isTerminated = sessionStorage.getItem(`ion_exam_terminated_${state.sessionId}`) === 'true';

  const questionsList = Object.values(state.questionsById);
  const hasAnswersOrExplanations = questionsList.some(q => q.correctAnswer || q.explanation);

  return (
    <div className="cbt-summary-container">
      <div className="cbt-summary-card">
        {isTerminated && (
          <div className="cbt-termination-alert" style={{
            background: '#fff5f5',
            border: '1px solid #fed7d7',
            borderRadius: '6px',
            padding: '16px',
            color: '#c53030',
            fontSize: '14px',
            lineHeight: '1.6',
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            ⚠️ Exam Terminated: Security violation detected (tab/window switching or page refresh).
          </div>
        )}

        <div className="cbt-summary-header">
          <h2>Exam Practice Session Complete</h2>
          <p className="cbt-summary-subtitle">TCS iON CBT Environment Practice Summary</p>
        </div>

        <div className="cbt-summary-stats-grid">
          <div className="cbt-stat-box">
            <span className="cbt-stat-num">{summary.total}</span>
            <span className="cbt-stat-label">Total Questions</span>
          </div>
          <div className="cbt-stat-box status-answered">
            <span className="cbt-stat-num">{summary.answered}</span>
            <span className="cbt-stat-label">Answered</span>
          </div>
          <div className="cbt-stat-box status-not-answered">
            <span className="cbt-stat-num">{notAttempted}</span>
            <span className="cbt-stat-label">Not Attempted</span>
          </div>
          <div className="cbt-stat-box status-marked">
            <span className="cbt-stat-num">{summary.marked}</span>
            <span className="cbt-stat-label">Marked for Review</span>
          </div>
          <div className="cbt-stat-box status-answered-marked">
            <span className="cbt-stat-num">{summary.answeredMarked}</span>
            <span className="cbt-stat-label">Answered & Marked</span>
          </div>
        </div>

        <div className="cbt-summary-breakdown">
          <h3>Section-wise Attempt Breakdown</h3>
          <table className="cbt-summary-table">
            <thead>
              <tr>
                <th>Section</th>
                <th>Total</th>
                <th>Answered</th>
                <th>Not Attempted</th>
                <th>Marked</th>
                <th>Answered & Marked</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(summary.sectionBreakdown).map(([secName, counts]) => {
                const secNotAttempted = counts.total - counts.answered - counts.marked - counts.answeredMarked;
                return (
                  <tr key={secName}>
                    <td className="sec-name">{secName}</td>
                    <td>{counts.total}</td>
                    <td className="count-answered">{counts.answered}</td>
                    <td>{secNotAttempted}</td>
                    <td className="count-marked">{counts.marked}</td>
                    <td className="count-answered-marked">{counts.answeredMarked}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {hasAnswersOrExplanations && (
          <div style={{ marginTop: '25px', textAlign: 'left' }}>
            <button 
              className="cbt-btn cbt-btn-secondary" 
              onClick={() => setShowSolutions(!showSolutions)}
              style={{ width: '100%', marginBottom: '15px' }}
            >
              {showSolutions ? '▲ Hide Solutions & Explanations' : '▼ View Solutions & Explanations'}
            </button>

            {showSolutions && (
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ color: '#2b6cb0', marginBottom: '15px' }}>Solutions & Answer Keys</h4>
                {questionsList.map((q, idx) => {
                  const selectedOptId = q.selected && q.selected[0];
                  const matchedCorrect = q.options.find(o => o.id === q.correctAnswer || o.key === q.correctAnswer);

                  return (
                    <div key={q.id} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '12px 16px', marginBottom: '12px' }}>
                      <strong style={{ color: '#2d3748' }}>Q{idx + 1}. {q.stemMarkdown}</strong>
                      <div style={{ marginTop: '8px', fontSize: '12.5px' }}>
                        {matchedCorrect && (
                          <div style={{ color: '#276749', fontWeight: '600' }}>
                            ✓ Correct Answer: ({matchedCorrect.key}) {matchedCorrect.markdown}
                          </div>
                        )}
                        {q.explanation && (
                          <div style={{ marginTop: '4px', color: '#4a5568', fontStyle: 'italic', background: '#ebf8ff', padding: '8px', borderRadius: '4px' }}>
                            <strong>Explanation:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="cbt-summary-notice" style={{ marginTop: '20px' }}>
          <p>
            <strong>Note on Evaluation:</strong> TCS iON CBT Environment Practice Session Completed.
          </p>
        </div>

        <div className="cbt-summary-actions">
          <button className="cbt-btn cbt-btn-primary" onClick={onRestart}>
            Start Another Practice Session
          </button>
        </div>
      </div>
    </div>
  );
}
