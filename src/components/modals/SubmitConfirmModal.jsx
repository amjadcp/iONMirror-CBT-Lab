import React from 'react';

export default function SubmitConfirmModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="cbt-modal-overlay">
      <div className="cbt-modal-container">
        <div className="cbt-modal-header">
          <h3>Submission Confirmation</h3>
        </div>
        <div className="cbt-modal-body">
          <p className="cbt-modal-warning">
            ⚠️ WARNING: Are you sure you want to submit your exam?
          </p>
          <p>
            Once you submit, all your answers will be locked, the timer will stop, and you will not be able to return to the exam or edit your selections.
          </p>
        </div>
        <div className="cbt-modal-footer">
          <button className="cbt-btn cbt-btn-secondary" onClick={onCancel}>
            Return to Exam
          </button>
          <button className="cbt-btn cbt-btn-submit-confirm" onClick={onConfirm}>
            Submit Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
