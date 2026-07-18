import React from 'react';
import { useExamState } from '../../context/ExamStateContext';

export default function SummaryScreen({ onRestart }) {
  const { state } = useExamState();
  const { summary } = state.submission;

  if (!summary) return null;

  const notAttempted = summary.total - summary.answered - summary.marked - summary.answeredMarked;

  return (
    <div className="cbt-summary-container">
      <div className="cbt-summary-card">
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

        <div className="cbt-summary-notice">
          <p>
            <strong>Note on Evaluation:</strong> Correct and incorrect answers are not evaluated. In a real exam, "Answered" and "Answered & Marked for Review" questions are evaluated, while "Marked for Review" questions are ignored.
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
