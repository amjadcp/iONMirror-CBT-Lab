export function validateQuestionPayload(body) {
  if (!body) {
    return { valid: false, errors: ['Request body cannot be empty'] };
  }

  const errors = [];

  // If body contains a raw markdown string
  if (typeof body === 'string' || typeof body.markdown === 'string') {
    const markdownContent = typeof body === 'string' ? body : body.markdown;
    if (!markdownContent || markdownContent.trim().length === 0) {
      errors.push('Markdown content cannot be empty');
    }
    return {
      valid: errors.length === 0,
      errors,
      data: { markdown: markdownContent }
    };
  }

  if (typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object or string'] };
  }

  if (!Array.isArray(body.questions)) {
    errors.push('questions must be an array');
  } else {
    body.questions.forEach((q, idx) => {
      if (!q.id || typeof q.id !== 'string') {
        q.id = `q_${idx + 1}`;
      }
      if (!q.section || typeof q.section !== 'string') {
        q.section = 'General Section';
      }
      if (!q.type) {
        q.type = 'single';
      }
      if (typeof q.marks !== 'number') {
        q.marks = 3;
      }
      if (typeof q.stemMarkdown !== 'string' && typeof q.text !== 'string') {
        errors.push(`questions[${idx}] must contain a stemMarkdown or text string`);
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        errors.push(`questions[${idx}].options must be an array with at least 2 options`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    data: body
  };
}
