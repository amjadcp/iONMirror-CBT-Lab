import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function SessionSetup() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const examUrl = `${window.location.origin}/session/${sessionId}`;
  const webhookUrl = `${window.location.origin}/api/webhook/${sessionId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceed = () => {
    navigate(`/session/${sessionId}`);
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <h2 className="setup-title">Session Details</h2>
        <p className="setup-desc">
          Your simulator session has been successfully initialized. Review details below:
        </p>

        <div className="setup-details">
          <div className="setup-field-group">
            <label>Candidate ID</label>
            <input type="text" readOnly value="Candidate_Practice_01" />
          </div>

          <div className="setup-field-group">
            <label>Tool Session URL</label>
            <input type="text" readOnly value={examUrl} onClick={(e) => e.target.select()} />
            <small>Use this URL to view the exam environment.</small>
          </div>

          <div className="setup-field-group">
            <label>Webhook URL (POST)</label>
            <div className="setup-input-copy-wrapper">
              <input type="text" readOnly value={webhookUrl} onClick={(e) => e.target.select()} />
              <button className="cbt-copy-btn" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <small>The embedded website configuration panel will trigger questions here automatically.</small>
          </div>
        </div>

        <button className="cbt-btn cbt-btn-primary setup-btn" onClick={handleProceed}>
          Proceed to Exam Environment
        </button>
      </div>
    </div>
  );
}
