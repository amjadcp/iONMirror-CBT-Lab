import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Trigger welcome modal for first time users using localStorage
  useEffect(() => {
    const isFirstTime = localStorage.getItem('examrig_first_time') === null;
    if (isFirstTime) {
      setShowWelcome(true);
    }
  }, []);

  const closeWelcome = () => {
    localStorage.setItem('examrig_first_time', 'false');
    setShowWelcome(false);
  };

  const handleStartSession = () => {
    const randomId = 'sess_' + Math.random().toString(36).substring(2, 8);
    navigate(`/session/${randomId}/generate`);
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page-wrapper">
      {/* 1. Hero / Header Section */}
      <section className="hero-section">
        <div className="hero-left">
          <h1 className="hero-headline">ExamRig — Realistic TCS iON‑Style CBT Practice</h1>
          <p className="hero-subhead">
            Practice Indian competitive MCQ exams (AFCAT, TA, SSC, GATE) in a true‑to‑life exam environment that reproduces the restrictive UI students face so you build familiarity under pressure.
          </p>
          <div className="hero-ctas">
            <button className="cbt-btn cbt-btn-primary landing-btn" style={{ maxWidth: '240px' }} onClick={handleStartSession}>
              Start a Practice Session
            </button>
            <a className="hero-secondary-link" onClick={() => scrollToSection('how-it-helps')}>
              See How It Works
            </a>
          </div>
        </div>
        <div className="hero-right">
          <img 
            src="/hero_illustration.png" 
            alt="ExamRig CBT Laptop Simulator Mockup" 
            className="hero-img"
          />
        </div>
      </section>

      {/* 2. Main Content Container */}
      <div className="landing-content-container">
        
        {/* Callouts (Three Small Highlights) */}
        <section className="highlights-container">
          <div className="highlight-box">
            <h4>Realistic Friction</h4>
            <p>Mimics exact UX annoyances so you don’t get surprised on exam day.</p>
          </div>
          <div className="highlight-box">
            <h4>Live Question Delivery</h4>
            <p>The embedded AI sends questions directly to your session — no extra uploads required.</p>
          </div>
          <div className="highlight-box">
            <h4>Image‑first Options</h4>
            <p>Full support for diagram options and zoomable images, same as many real CBT questions.</p>
          </div>
        </section>

        {/* What this tool is */}
        <section className="landing-section" id="what-is-tool">
          <h2>What is ExamRig?</h2>
          <div className="landing-section-body">
            <p>
              ExamRig is a practice environment that intentionally recreates the look and feel of common CBT exam clients used in India. It’s not an official exam provider — it’s a simulator designed to train you to handle the exact UI friction and behaviours you’ll encounter in real tests, including limited scrolling, block‑based question navigation, and strict save/submit flows.
            </p>
          </div>
        </section>

        {/* How it helps you */}
        <section className="landing-section" id="how-it-helps">
          <h2>How It Helps You</h2>
          <div className="landing-section-body">
            <ul className="help-list">
              <li className="help-item">
                <span className="help-bullet">✓</span>
                <span>Familiarize yourself with the exam layout, time pressure, and navigation style used by many institutions.</span>
              </li>
              <li className="help-item">
                <span className="help-bullet">✓</span>
                <span>Practice answering MCQs that include diagram and image options — viewable in a constrained pane and zoomable on demand.</span>
              </li>
              <li className="help-item">
                <span className="help-bullet">✓</span>
                <span>Train under realistic constraints (no keyboard shortcuts, manual save, “mark for review” flow) so you make fewer mistakes on test day.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* How to use the tool (simple 3-step flow) */}
        <section className="landing-section" id="how-to-use">
          <h2>How to Use the Tool</h2>
          <div className="steps-container">
            <div className="step-card">
              <div className="step-num">1</div>
              <h3>Start a session</h3>
              <p>Click “Start a Practice Session” to open a unique practice session page. You’ll see the exam interface and a configuration panel beside it.</p>
            </div>
            <div className="step-card">
              <div className="step-num">2</div>
              <h3>Configure questions via embedded AI</h3>
              <p>Use the embedded AI generator to select exam type, sections, difficulty and number of questions; it automatically sends the generated questions to your session.</p>
            </div>
            <div className="step-card">
              <div className="step-num">3</div>
              <h3>Practice inside simulated exam</h3>
              <p>Answer questions using the on‑screen controls (Save & Next, Mark for Review). The UI intentionally mimics restrictions like disabled mouse‑wheel scrolling and fixed 10‑question blocks so you learn to manage them.</p>
            </div>
          </div>
        </section>

        {/* Session status & feedback (microcopy) */}
        <section className="landing-section" id="status-feedback">
          <h2>Session Status & Feedback Indicators</h2>
          <div className="landing-section-body">
            <table className="cbt-summary-table" style={{ fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ width: '30%', textAlign: 'left' }}>Session State</th>
                  <th style={{ textAlign: 'left' }}>Microcopy Message Displayed</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="sec-name">Waiting for questions</td>
                  <td>“No questions yet — configure the AI generator panel to create your exam.”</td>
                </tr>
                <tr>
                  <td className="sec-name">Questions received</td>
                  <td>“Questions loaded. Start answering. Timer active.”</td>
                </tr>
                <tr>
                  <td className="sec-name">Mid‑session update</td>
                  <td>“Additional questions added based on your configuration; check the palette.”</td>
                </tr>
                <tr>
                  <td className="sec-name">Time up</td>
                  <td>“Time’s up — exam submitted. View your session summary.”</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Exam layout overview (short descriptors) */}
        <section className="landing-section" id="exam-layout-overview">
          <h2>Exam Layout Overview</h2>
          <div className="layout-grid">
            <div className="layout-item">
              <strong>Header</strong>
              <span>Shows exam name, candidate label and countdown timer.</span>
            </div>
            <div className="layout-item">
              <strong>Section tabs</strong>
              <span>Jump between sections (Quant, English, Reasoning, Technical).</span>
            </div>
            <div className="layout-item">
              <strong>Question pane</strong>
              <span>Displays the current question and options; images appear inline and open in a zoom modal.</span>
            </div>
            <div className="layout-item">
              <strong>Palette</strong>
              <span>Numbered tiles show question status (Not Visited, Not Answered, Answered, Marked).</span>
            </div>
            <div className="layout-item">
              <strong>Footer controls</strong>
              <span>Previous, Save & Next, Clear Response, Mark for Review & Next, Submit.</span>
            </div>
          </div>
        </section>

        {/* What you will not get (callout) */}
        <section className="landing-section" id="limitations">
          <h2>Evaluation Disclaimer</h2>
          <div className="not-got-callout">
            <strong>What you will not get:</strong> There’s no built‑in answer key or automatic score reveal after submission — this tool focuses on environment familiarity and process practice, not immediate grading.
          </div>
        </section>

        {/* Footer CTAs */}
        <footer className="landing-footer-ctas">
          <button className="cbt-btn cbt-btn-primary" onClick={handleStartSession}>
            Start Practice Session
          </button>
          
          <div className="footer-links-group">
            <a className="footer-link" onClick={() => setShowNotes(true)}>
              Read the FRD / Design Notes
            </a>
          </div>
        </footer>

      </div>

      {/* Welcome Modal for First-time Users */}
      {showWelcome && (
        <div className="welcome-modal-overlay">
          <div className="welcome-modal-card">
            <h3>Welcome to ExamRig</h3>
            <p>
              This simulator recreates restrictive CBT software behavior so you can practice under the same conditions. Start a session and configure the embedded AI panel to generate questions for your chosen exam. Good luck!
            </p>
            <button className="cbt-btn cbt-btn-primary" onClick={closeWelcome}>
              Got It / Proceed
            </button>
          </div>
        </div>
      )}

      {/* FRD / Design Notes Modal */}
      {showNotes && (
        <div className="welcome-modal-overlay" onClick={() => setShowNotes(false)}>
          <div className="welcome-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h3>ExamRig Design Notes</h3>
            <p>
              ExamRig implements Indian Computer-Based Test (CBT) requirements under strict UX limitations:
            </p>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '-8px' }}>
              - Mouse-wheel scroll is disabled in the main question body to mimic actual testing clients.<br />
              - Navigation pagination is restricted to discrete blocks of 10 questions.<br />
              - The session is purely local and server-buffered to ensure zero credential/persistent database overhead.
            </p>
            <button className="cbt-btn cbt-btn-secondary" onClick={() => setShowNotes(false)}>
              Close Notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
