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

function parseSectionHeader(line) {
  const trimmed = line.trim();
  // Heading must explicitly start with Section or Part (e.g. "## Section: General Awareness", "## Part A: English")
  const match = trimmed.match(/^#+\s*(?:Section|Part)\b\s*:?\s*(.*)/i);
  if (match) {
    const secText = match[1].trim();
    return secText || trimmed.replace(/^#+\s*/, '');
  }
  return null;
}

function parseQuestionHeader(line) {
  const trimmed = line.trim();

  // Pattern 1: Starts with markdown heading (#, ##, ###, ####) + Question label or number
  // e.g., "#### Q1. ...", "### Question 1: ...", "## 1. ...", "# Q.1 ..."
  const headingMatch = trimmed.match(/^#+\s*(?:Q(?:uestion|\.)?\s*\d+|\d+)[\.\):\-\s]*(.*)/i);
  if (headingMatch) {
    return { isHeader: true, rest: headingMatch[1].trim() };
  }

  // Pattern 2: Starts with explicit Question keyword (Q1., Q1), Q.1., Question 1:, Q1 -, Q1:)
  // e.g., "Q1. ...", "Q1) ...", "Q.1. ...", "Q.1 ...", "Question 1: ...", "Q1: ...", "Q1 - ..."
  const qKeywordMatch = trimmed.match(/^(?:Q(?:uestion|\.)?\s*\d+)[\.\):\-\s]*(.*)/i);
  if (qKeywordMatch) {
    return { isHeader: true, rest: qKeywordMatch[1].trim() };
  }

  // Pattern 3: Starts with standalone number followed by dot/paren/colon at start of line
  // e.g., "1. ...", "1) ...", "1: ..." (up to 3 digits)
  const numMatch = trimmed.match(/^(\d{1,3})[\.\):\)]\s+(.*)/);
  if (numMatch) {
    return { isHeader: true, rest: numMatch[2].trim() };
  }

  return { isHeader: false, rest: '' };
}

/**
 * Parse a raw Markdown/TXT text document into structured question objects.
 * Handles complex passage questions, sentence rearrangement sets (A., B., C., D., E. in stem),
 * bulleted options (- (A) B), standard options (A. text), answer keys, and explanations.
 */
function parseMarkdownText(text) {
  if (!text) return { metadata: null, questions: [] };

  const lines = text.split(/\r?\n/);
  let currentSection = 'General Section';
  let metadata = null;
  const questions = [];

  // Step 1: Extract document title metadata if present at top
  const nonBlankLines = lines.map(l => l.trim()).filter(Boolean);
  if (nonBlankLines.length > 0) {
    const firstLine = nonBlankLines[0];
    if (firstLine.startsWith('# ') && !firstLine.match(/^#\s*(?:Q(?:uestion|\.)?\s*\d+|\d+)/i)) {
      metadata = parseMockTestFilename(firstLine.replace(/^#\s+/, ''));
    } else if (firstLine.toLowerCase().startsWith('filename:')) {
      metadata = parseMockTestFilename(firstLine.replace(/^filename:\s*/i, ''));
    }
  }

  // Step 2: Split content into raw question blocks
  const blocks = [];
  let currentBlock = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Check for explicit Section header: ## Section: Verbal Ability or # Section 1
    const newSec = parseSectionHeader(trimmed);
    if (newSec) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      currentSection = newSec;
      return;
    }

    // Check for Question header
    const qHeader = parseQuestionHeader(trimmed);
    if (qHeader.isHeader) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        section: currentSection,
        headerRest: qHeader.rest,
        lines: []
      };
      return;
    }

    if (currentBlock) {
      currentBlock.lines.push(trimmed);
    }
  });

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  // Fallback: If no blocks were created (e.g. file has no Q1 headers), create a default block with all non-section lines
  if (blocks.length === 0 && lines.some(l => l.trim())) {
    currentBlock = {
      section: currentSection,
      headerRest: '',
      lines: lines.map(l => l.trim()).filter(Boolean)
    };
    blocks.push(currentBlock);
  }

  // Step 3: Process each question block
  blocks.forEach((block, index) => {
    const qId = `q_${index + 1}_${Math.random().toString(36).substring(2, 6)}`;
    let stemLines = [];
    if (block.headerRest) {
      stemLines.push(block.headerRest);
    }

    const rawLines = block.lines;
    const options = [];
    let rawAnswer = null;
    let explanationLines = [];

    // Check if the block has explicit bulleted/parenthesized options: "- (A)", "* (A)", "- A.", "(A)", "(B)"
    const bulletOptRegex = /^(?:[\-\*]\s*)?[\(\[]([A-Da-d])[\)\]]\s*(.*)/;
    const dashOptRegex = /^(?:[\-\*]\s*)([A-Da-d])[\.\)]\s*(.*)/;

    const hasExplicitBulletedOptions = rawLines.some(l => bulletOptRegex.test(l) || dashOptRegex.test(l));

    let inExplanation = false;

    rawLines.forEach((l) => {
      // Check for Answer line: **Answer:** A or Answer: (A)
      const ansMatch = l.match(/^(?:\*\*)?Answer:?(?:\*\*)?\s*(.+)/i);
      if (ansMatch) {
        rawAnswer = ansMatch[1].trim();
        inExplanation = false;
        return;
      }

      // Check for Explanation line: **Explanation:** ...
      const expMatch = l.match(/^(?:\*\*)?Explanation:?(?:\*\*)?\s*(.*)/i);
      if (expMatch) {
        if (expMatch[1].trim()) {
          explanationLines.push(expMatch[1].trim());
        }
        inExplanation = true;
        return;
      }

      if (inExplanation) {
        explanationLines.push(l);
        return;
      }

      // Check if line contains multiple inline options on a single line: "- (A) - (B) - (C) - (D)"
      const multiOptMatches = [...l.matchAll(/(?:[\-\*]\s*)?[\(\[]([A-Da-d])[\)\]]\s*([^\-\*\(\)]*)/g)];
      if (multiOptMatches.length >= 2) {
        multiOptMatches.forEach(m => {
          const key = m[1].toUpperCase();
          const optText = m[2].trim() || `Option ${key}`;
          options.push({
            id: `opt_${key}_${Math.random().toString(36).substring(2, 6)}`,
            key: key,
            markdown: optText,
            text: optText
          });
        });
        return;
      }

      if (hasExplicitBulletedOptions) {
        // High-priority matching: only lines starting with bulleted/parenthesized option markers are options
        const bMatch = l.match(bulletOptRegex) || l.match(dashOptRegex);
        if (bMatch) {
          const key = bMatch[1].toUpperCase();
          const optText = bMatch[2].trim() || `Option ${key}`;
          options.push({
            id: `opt_${key}_${Math.random().toString(36).substring(2, 6)}`,
            key: key,
            markdown: optText,
            text: optText
          });
        } else {
          // All other lines (including A., B., C., D., E. sentences in rearrangement questions) belong to the stem!
          stemLines.push(l);
        }
      } else {
        // Fallback matching for non-bulleted options (e.g., "A. Option text")
        const stdMatch = l.match(/^(?:[\-\*]\s*)?[\(\[]?([A-Da-d])[\)\]\.]?\s+(.+)/);
        if (stdMatch) {
          const key = stdMatch[1].toUpperCase();
          const optText = stdMatch[2].trim() || `Option ${key}`;
          options.push({
            id: `opt_${key}_${Math.random().toString(36).substring(2, 6)}`,
            key: key,
            markdown: optText,
            text: optText
          });
        } else {
          stemLines.push(l);
        }
      }
    });

    const stemMarkdown = stemLines.join('\n\n').trim();
    const explanation = explanationLines.join(' ').trim();
    const correctAnswer = resolveCorrectAnswerId(options, rawAnswer);

    questions.push({
      id: qId,
      section: block.section || 'General Section',
      type: 'single',
      marks: 3,
      negativeMarks: 1,
      stemMarkdown: stemMarkdown || 'Question text',
      options,
      correctAnswer,
      explanation
    });
  });

  return { metadata, questions };
}

function resolveCorrectAnswerId(options, answerStr) {
  if (!answerStr || !Array.isArray(options) || options.length === 0) return null;
  const cleanAns = answerStr.replace(/[\(\)\[\]\*]/g, '').trim().toUpperCase();

  // 1. Try matching by option key (A, B, C, D)
  const byKey = options.find(o => o.key && o.key.toUpperCase() === cleanAns);
  if (byKey) return byKey.id;

  // 2. Try matching by exact option text
  const byText = options.find(o => o.text && o.text.trim().toUpperCase() === cleanAns);
  if (byText) return byText.id;

  // 3. Fallback to raw cleanAns
  return cleanAns;
}

function finalizeQuestion(q) {
  return q;
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
