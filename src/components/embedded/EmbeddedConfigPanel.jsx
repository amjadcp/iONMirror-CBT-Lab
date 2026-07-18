import React, { useState } from 'react';
import { useExamState } from '../../context/ExamStateContext';

export default function EmbeddedConfigPanel() {
  const { state } = useExamState();
  const { sessionId, questionsById } = state;
  const [copied, setCopied] = useState(false);

  const webhookUrl = `${window.location.origin}/api/webhook/${sessionId}`;
  const toolUrl = `${window.location.origin}/session/${sessionId}`;
  const questionsCount = Object.keys(questionsById).length;

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="cbt-config-panel">
      <div className="cbt-config-panel-header">
        <h4>Question Configuration (AI Generator)</h4>
        <p className="cbt-config-desc">
          The panel below simulates an external generator. Click "Generate" to POST questions into this session.
        </p>
      </div>

      <div className="cbt-url-fields">
        <div className="cbt-url-field-group">
          <label>Tool Session URL (reference)</label>
          <input type="text" readOnly value={toolUrl} onClick={(e) => e.target.select()} />
        </div>
        <div className="cbt-url-field-group">
          <label>Webhook URL (POST questions here)</label>
          <div className="cbt-input-copy-wrapper">
            <input type="text" readOnly value={webhookUrl} onClick={(e) => e.target.select()} />
            <button className="cbt-copy-btn" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      <div className="cbt-iframe-container">
        <iframe
          src={`/generator?sessionId=${sessionId}`}
          title="Embedded AI Question Generator"
          className="cbt-generator-iframe"
        />
      </div>

      <div className="cbt-config-panel-footer">
        <div className="cbt-status-indicator">
          <span className={`cbt-status-dot ${questionsCount > 0 ? 'active' : ''}`}></span>
          <span className="cbt-status-text">
            {questionsCount > 0 
              ? `Questions received! (${questionsCount} loaded)` 
              : 'Waiting for configuration payload...'}
          </span>
        </div>
      </div>
    </div>
  );
}
