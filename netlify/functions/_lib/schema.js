export function validateQuestionPayload(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object'] };
  }

  const errors = [];
  
  if (!body.sessionId || typeof body.sessionId !== 'string') {
    errors.push('sessionId is required and must be a string');
  }

  if (!Array.isArray(body.questions)) {
    errors.push('questions must be an array');
  } else {
    body.questions.forEach((q, idx) => {
      if (!q.id || typeof q.id !== 'string') {
        errors.push(`questions[${idx}].id is required and must be a string`);
      }
      if (!q.section || typeof q.section !== 'string') {
        errors.push(`questions[${idx}].section is required and must be a string`);
      }
      if (q.type !== 'single' && q.type !== 'multiple') {
        errors.push(`questions[${idx}].type must be "single" or "multiple"`);
      }
      if (typeof q.marks !== 'number') {
        errors.push(`questions[${idx}].marks must be a number`);
      }
      if (typeof q.stemMarkdown !== 'string') {
        errors.push(`questions[${idx}].stemMarkdown must be a string`);
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        errors.push(`questions[${idx}].options must be an array with at least 2 options`);
      } else {
        q.options.forEach((opt, optIdx) => {
          if (!opt.id || typeof opt.id !== 'string') {
            errors.push(`questions[${idx}].options[${optIdx}].id is required and must be a string`);
          }
          if (typeof opt.markdown !== 'string') {
            errors.push(`questions[${idx}].options[${optIdx}].markdown is required and must be a string`);
          }
        });
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    data: body
  };
}
