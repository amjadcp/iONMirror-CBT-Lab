/**
 * Helper to parse mock test metadata from file names following the format:
 * "AFCAT 2026 Full Length Mock Test 01 | 10 Questions | 10 mins.md"
 */
export function parseMockTestFilename(filename = '') {
  const cleanName = filename.replace(/\.(md|txt)$/i, '').trim();
  const parts = cleanName.split('|').map(s => s.trim());

  const title = parts[0] || cleanName;

  let questionsCount = 0;
  if (parts[1]) {
    const qMatch = parts[1].match(/(\d+)/);
    if (qMatch) questionsCount = parseInt(qMatch[1], 10);
  }

  let durationMins = 10;
  if (parts[2]) {
    const dMatch = parts[2].match(/(\d+)/);
    if (dMatch) durationMins = parseInt(dMatch[1], 10);
  }

  return { title, questionsCount, durationMins };
}

/**
 * Browser-only helper to fetch raw Markdown/TXT files directly from a public GitHub URL,
 * parse questions and filename metadata, and return the result without saving to Netlify Blobs.
 */
export async function loadQuestionsFromGitHubUrl(githubRawUrl) {
  try {
    const filename = githubRawUrl.split('/').pop() || '';
    const fileMeta = parseMockTestFilename(filename);

    const res = await fetch(githubRawUrl);
    if (!res.ok) throw new Error(`GitHub fetch failed: ${res.statusText}`);

    const rawText = await res.text();
    const parsed = parseQuestionsFromRaw(rawText);

    return {
      metadata: parsed.metadata || fileMeta,
      questions: parsed.questions
    };
  } catch (err) {
    console.error('Error fetching questions from GitHub:', err);
    throw err;
  }
}

/**
 * Universal question parser that parses raw Markdown/TXT strings, GitHub raw file contents,
 * or JSON payloads into normalized CBT question objects.
 *
 * Supports optional fields:
 * - Answer key (**Answer:** A or Answer: A)
 * - Explanation (**Explanation:** ...)
 */
export function parseQuestionsFromRaw(input) {
  if (!input) return { metadata: null, questions: [] };

  // If input is already an array of structured question objects
  if (Array.isArray(input)) {
    return {
      metadata: null,
      questions: input.map((q, idx) => normalizeQuestionObject(q, idx))
    };
  }

  // If input is an object with markdown string or questions array
  if (typeof input === 'object' && input !== null) {
    if (typeof input.markdown === 'string') {
      return parseMarkdownText(input.markdown);
    }
    if (Array.isArray(input.questions)) {
      return {
        metadata: input.examType ? { title: input.examType } : null,
        questions: input.questions.map((q, idx) => normalizeQuestionObject(q, idx))
      };
    }
  }

  // If input is a raw Markdown/TXT string
  if (typeof input === 'string') {
    return parseMarkdownText(input);
  }

  return { metadata: null, questions: [] };
}

/**
 * Parse a raw Markdown/TXT text document into structured question objects.
 */
function parseMarkdownText(text) {
  const lines = text.split(/\r?\n/);
  let currentSection = 'General Section';
  let metadata = null;
  const questions = [];

  let currentQuestion = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Check for title metadata line: # AFCAT 2026... | 10 Questions | 10 mins
    if (trimmed.startsWith('# ')) {
      const headerText = trimmed.replace(/^#\s+/, '');
      metadata = parseMockTestFilename(headerText);
      return;
    }

    // Check for section header: ### Section: General Awareness or ## Section Name
    if (trimmed.startsWith('##')) {
      const secText = trimmed.replace(/^#+\s*/, '').replace(/^Section:\s*/i, '').trim();
      if (secText) {
        currentSection = secText;
      }
      return;
    }

    // Check for new Question header: #### Q1. or Q1) or 1.
    const qHeaderMatch = trimmed.match(/^(?:####\s*)?(?:Q\d+[\.\)]|\d+[\.\)])\s*(.+)/i);
    if (qHeaderMatch) {
      if (currentQuestion && currentQuestion.options.length >= 2) {
        questions.push(finalizeQuestion(currentQuestion));
      }

      const qText = qHeaderMatch[1].trim();
      currentQuestion = {
        id: `q_${questions.length + 1}_${Math.random().toString(36).substring(2, 6)}`,
        section: currentSection,
        type: 'single',
        stemMarkdown: qText,
        options: [],
        correctAnswer: null,
        explanation: '',
        marks: 3,
        negativeMarks: 1
      };
      return;
    }

    if (!currentQuestion) return;

    // Check for Option line: - (A) Option text or A) Option text or (A) Option text or A. Option text
    const optMatch = trimmed.match(/^(?:[\-\*]\s*)?[\(\[]?([A-Da-d])[\)\]\.]?\s+(.+)/);
    if (optMatch && !trimmed.toLowerCase().startsWith('answer:') && !trimmed.toLowerCase().startsWith('**answer')) {
      const key = optMatch[1].toUpperCase();
      const optText = optMatch[2].trim();
      currentQuestion.options.push({
        id: `opt_${key}_${Math.random().toString(36).substring(2, 6)}`,
        key: key,
        markdown: optText,
        text: optText
      });
      return;
    }

    // Check for Answer key line: **Answer:** A or Answer: (A) or Answer: A
    const ansMatch = trimmed.match(/^(?:\*\*)?Answer:?(?:\*\*)?\s*[\(\[]?([A-Da-d])[\)\]]?/i);
    if (ansMatch) {
      currentQuestion.correctAnswerKey = ansMatch[1].toUpperCase();
      return;
    }

    // Check for Explanation line: **Explanation:** ... or Explanation: ...
    const expMatch = trimmed.match(/^(?:\*\*)?Explanation:?(?:\*\*)?\s*(.+)/i);
    if (expMatch) {
      currentQuestion.explanation = expMatch[1].trim();
      return;
    }

    // Append multi-line question text or explanation line if active
    if (currentQuestion.options.length === 0) {
      currentQuestion.stemMarkdown += '\n' + trimmed;
    } else if (currentQuestion.explanation) {
      currentQuestion.explanation += ' ' + trimmed;
    }
  });

  if (currentQuestion && currentQuestion.options.length >= 2) {
    questions.push(finalizeQuestion(currentQuestion));
  }

  return { metadata, questions };
}

function finalizeQuestion(q) {
  // Resolve correctAnswer option ID if correctAnswerKey exists
  let correctAnswer = null;
  if (q.correctAnswerKey) {
    const matchedOpt = q.options.find(o => o.key === q.correctAnswerKey);
    if (matchedOpt) {
      correctAnswer = matchedOpt.id;
    } else {
      correctAnswer = q.correctAnswerKey;
    }
  }

  return {
    id: q.id,
    section: q.section,
    type: q.type,
    marks: q.marks,
    negativeMarks: q.negativeMarks,
    stemMarkdown: q.stemMarkdown,
    options: q.options,
    correctAnswer: correctAnswer,
    explanation: q.explanation || ''
  };
}

function normalizeQuestionObject(q, idx) {
  const options = Array.isArray(q.options)
    ? q.options.map((opt, optIdx) => {
        const key = String.fromCharCode(65 + optIdx); // A, B, C, D
        if (typeof opt === 'string') {
          return { id: `opt_${idx}_${optIdx}`, key, markdown: opt, text: opt };
        }
        return {
          id: opt.id || `opt_${idx}_${optIdx}`,
          key: opt.key || key,
          markdown: opt.markdown || opt.text || '',
          text: opt.text || opt.markdown || ''
        };
      })
    : [];

  return {
    id: q.id || `q_${idx + 1}`,
    section: q.section || 'General Section',
    type: q.type || 'single',
    marks: typeof q.marks === 'number' ? q.marks : 3,
    negativeMarks: typeof q.negativeMarks === 'number' ? q.negativeMarks : 1,
    stemMarkdown: q.stemMarkdown || q.text || '',
    options,
    correctAnswer: q.correctAnswer || q.answer || null,
    explanation: q.explanation || ''
  };
}
