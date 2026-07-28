import React, { useState } from 'react';
import { useExamState } from '../../context/ExamStateContext';
import { trackEvent } from '../../utils/analytics';
import { generatePDFReport } from '../../utils/pdfReportGenerator';

export default function SummaryScreen({ onRestart }) {
  const { state } = useExamState();
  const { summary } = state.submission;

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [downloadBlobUrl, setDownloadBlobUrl] = useState(null);

  if (!summary) return null;

  const notAttempted = summary.total - summary.answered - summary.marked - summary.answeredMarked;
  const isTerminated = sessionStorage.getItem(`ion_exam_terminated_${state.sessionId}`) === 'true';

  const questionsList = Object.values(state.questionsById);

  let correctCount = 0;
  let wrongCount = 0;
  let totalScore = 0;
  let maxPossibleScore = 0;
  let hasScoringData = false;

  const sectionStats = {};

  questionsList.forEach(q => {
    const secName = q.section || state.currentSection || 'General';
    if (!sectionStats[secName]) {
      sectionStats[secName] = {
        total: 0,
        answered: 0,
        correct: 0,
        wrong: 0,
        notAttempted: 0,
        marked: 0,
        answeredMarked: 0,
        score: 0
      };
    }

    const stats = sectionStats[secName];
    stats.total += 1;

    const qMarks = Number(q.marks) || 3;
    maxPossibleScore += qMarks;

    const selectedOptId = q.selected && q.selected[0];

    if (q.status === 'answered') stats.answered += 1;
    else if (q.status === 'marked') stats.marked += 1;
    else if (q.status === 'answered_marked') stats.answeredMarked += 1;
    else stats.notAttempted += 1;

    if (selectedOptId && q.correctAnswer) {
      hasScoringData = true;
      const isCorrect = selectedOptId.toString().toLowerCase() === q.correctAnswer.toString().toLowerCase();
      if (isCorrect) {
        correctCount += 1;
        totalScore += qMarks;
        stats.correct += 1;
        stats.score += qMarks;
      } else {
        wrongCount += 1;
        totalScore -= 1; // standard 1 negative mark
        stats.wrong += 1;
        stats.score -= 1;
      }
    }
  });

  const handleOpenReportModal = async () => {
    const isDev = import.meta.env.DEV || import.meta.env.VITE_ENV === 'dev';
    if (isDev) {
      // In DEV environment: generate & download PDF file directly in browser
      try {
        const { pdfBlob } = await generatePDFReport({ state, candidateEmail: 'dev-mode@local.test' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfBlob);
        link.download = `TCS_iON_CBT_Report_${state.sessionId || 'DEV'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Error generating PDF in DEV environment:', err);
      }
      return;
    }

    // In PROD environment: open email popup modal
    setIsReportModalOpen(true);
    setIsSubmitted(false);
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
    setIsSubmitted(false);
  };

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsGenerating(true);
    trackEvent('request_report_email', 'engagement', email.trim());

    try {
      // 1. Generate multi-page PDF on frontend
      const { pdfBase64, pdfBlob } = generatePDFReport({ state, candidateEmail: email.trim() });
      const blobUrl = URL.createObjectURL(pdfBlob);
      setDownloadBlobUrl(blobUrl);

      // 2. Transmit to Netlify serverless function sendReport.js
      await fetch('/.netlify/functions/sendReport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          sessionId: state.sessionId,
          pdfBase64,
          summary: state.submission?.summary
        })
      });
    } catch (err) {
      console.error('Error generating or transmitting PDF report:', err);
    } finally {
      setIsGenerating(false);
      setIsSubmitted(true);
    }
  };

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

        {/* Score & Wrong Attempts Performance Banner */}
        <div className="cbt-score-summary-bar" style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          borderRadius: '8px',
          padding: '18px 24px',
          marginBottom: '22px',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: '4px' }}>
              Final Score
            </div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: totalScore >= 0 ? '#4ade80' : '#f87171' }}>
              {hasScoringData ? `${totalScore} / ${maxPossibleScore}` : 'Evaluation Pending'}
            </div>
          </div>

          <div style={{ width: '1px', height: '36px', background: '#334155' }} />

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: '4px' }}>
              Correct Answers
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ade80' }}>
              {hasScoringData ? correctCount : '—'}
            </div>
          </div>

          <div style={{ width: '1px', height: '36px', background: '#334155' }} />

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: '4px' }}>
              Wrong Attempts
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f87171' }}>
              {hasScoringData ? wrongCount : '—'}
            </div>
          </div>
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

        <div className="cbt-summary-notice" style={{
          marginTop: '24px',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '16px 20px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.08)'
        }}>
          <p style={{ margin: 0, fontSize: '15px', color: '#1e40af', fontWeight: '700' }}>
            📊 Get Your Detailed Section-wise Performance Report & Complete Answer Key!
          </p>
          <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#1d4ed8', lineHeight: '1.5' }}>
            Download your in-depth score analysis, accuracy metrics, and step-by-step question solutions delivered directly to your email.
          </p>
        </div>

        <div className="cbt-summary-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="cbt-btn cbt-btn-secondary" onClick={handleOpenReportModal} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            📥 Download Report & Answer Key
          </button>
          <button className="cbt-btn cbt-btn-primary" onClick={onRestart}>
            Start Another Practice Session
          </button>
        </div>
      </div>

      {/* Email Collection & PDF Report Popup Modal */}
      {isReportModalOpen && (
        <div className="cbt-modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)' }}>
          <div className="cbt-modal-container" style={{ maxWidth: '500px', width: '90%', padding: '24px' }}>
            <div className="cbt-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>📥 Download Report & Answer Key</h3>
              <button 
                onClick={handleCloseReportModal}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ×
              </button>
            </div>

            <div className="cbt-modal-body">
              {!isSubmitted ? (
                <form onSubmit={handleSubmitEmail}>
                  <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5', marginBottom: '16px' }}>
                    Enter your email address below. Your detailed multi-page performance report, section-wise analysis, exact time spent per question, and complete answer key with explanations will be emailed to you.
                  </p>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="reportEmail" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Email Address
                    </label>
                    <input
                      id="reportEmail"
                      type="email"
                      required
                      disabled={isGenerating}
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="button" className="cbt-btn cbt-btn-secondary" onClick={handleCloseReportModal} disabled={isGenerating}>
                      Cancel
                    </button>
                    <button type="submit" className="cbt-btn cbt-btn-primary" disabled={isGenerating}>
                      {isGenerating ? 'Generating PDF Report...' : 'Send Report via Email →'}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>✅</div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#15803d', fontSize: '16px' }}>Report Generated & Dispatched!</h4>
                  <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5', marginBottom: '20px' }}>
                    Your detailed evaluation report and complete answer key have been dispatched to <strong>{email}</strong>.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    {downloadBlobUrl && (
                      <a 
                        href={downloadBlobUrl} 
                        download={`TCS_iON_CBT_Report_${state.sessionId || 'Practice'}.pdf`}
                        className="cbt-btn cbt-btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}
                      >
                        📄 Save PDF File Directly
                      </a>
                    )}
                    <button className="cbt-btn cbt-btn-primary" onClick={handleCloseReportModal} style={{ width: '100%' }}>
                      Close Window
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
