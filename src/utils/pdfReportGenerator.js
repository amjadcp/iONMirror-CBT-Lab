import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Formats time spent in seconds into human-readable duration (e.g. "45 secs", "1 min 20 secs")
 */
function formatTimeSpent(seconds) {
  const sec = Number(seconds) || 0;
  if (sec < 60) {
    return `${sec} sec${sec !== 1 ? 's' : ''}`;
  }
  const mins = Math.floor(sec / 60);
  const remSec = sec % 60;
  if (remSec === 0) {
    return `${mins} min${mins !== 1 ? 's' : ''}`;
  }
  return `${mins} min ${remSec} sec${remSec !== 1 ? 's' : ''}`;
}

/**
 * Formats LaTeX mathematical expressions into clean, human-readable plain text math
 */
function formatLaTeXToReadableMath(text) {
  if (!text) return '';

  let formatted = text;

  // 1. Convert fractions: \dfrac{num}{den} or \frac{num}{den}
  let prev;
  do {
    prev = formatted;
    formatted = formatted.replace(/\\d?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, (match, num, den) => {
      const cleanNum = num.trim();
      const cleanDen = den.trim();
      return `(${cleanNum} / ${cleanDen})`;
    });
  } while (formatted !== prev);

  // 2. Convert square roots: \sqrt{x} or \sqrt[n]{x}
  formatted = formatted.replace(/\\sqrt\s*\[(.*?)\]\s*\{([^{}]+)\}/g, '$1√($2)');
  formatted = formatted.replace(/\\sqrt\s*\{([^{}]+)\}/g, '√($1)');

  // 3. Convert text wrappers: \text{...}, \mathrm{...}, \mathbf{...}, \mathit{...}
  formatted = formatted.replace(/\\(text|mathrm|mathbf|mathit|mb)\s*\{([^{}]+)\}/g, '$2');

  // 4. Convert common LaTeX symbols to Unicode math symbols
  const latexSymbolMap = {
    '\\\\times': ' × ',
    '\\\\cdot': ' · ',
    '\\\\ast': ' * ',
    '\\\\div': ' ÷ ',
    '\\\\pm': ' ± ',
    '\\\\mp': ' ∓ ',
    '\\\\leq?': ' ≤ ',
    '\\\\geq?': ' ≥ ',
    '\\\\neq': ' ≠ ',
    '\\\\approx': ' ≈ ',
    '\\\\equiv': ' ≡ ',
    '\\\\infty': ' ∞ ',
    '\\\\degree': '°',
    '\\\\circ': '°',
    '\\\\alpha': 'α',
    '\\\\beta': 'β',
    '\\\\gamma': 'γ',
    '\\\\delta': 'δ',
    '\\\\theta': 'θ',
    '\\\\pi': 'π',
    '\\\\sigma': 'σ',
    '\\\\omega': 'ω',
    '\\\\lambda': 'λ',
    '\\\\mu': 'μ',
    '\\\\Delta': 'Δ',
    '\\\\Sigma': 'Σ',
    '\\\\Omega': 'Ω',
    '\\\\quad': ' ',
    '\\\\qquad': '  ',
    '\\\\,': ' ',
    '\\\\;': ' ',
    '\\\\!': ''
  };

  Object.entries(latexSymbolMap).forEach(([pattern, val]) => {
    formatted = formatted.replace(new RegExp(pattern, 'g'), val);
  });

  // 5. Convert exponents & subscripts
  const superscripts = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ' };
  const subscripts = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎' };

  formatted = formatted.replace(/\^\{([^{}]+)\}/g, (match, p1) => p1.split('').map(char => superscripts[char] || char).join(''));
  formatted = formatted.replace(/\^([0-9n])/g, (match, p1) => superscripts[p1] || `^${p1}`);

  formatted = formatted.replace(/_\{([^{}]+)\}/g, (match, p1) => p1.split('').map(char => subscripts[char] || char).join(''));
  formatted = formatted.replace(/_([0-9])/g, (match, p1) => subscripts[p1] || `_${p1}`);

  // 6. Strip enclosing LaTeX delimiters ($, $$, \(, \))
  formatted = formatted
    .replace(/\$\$/g, '')
    .replace(/\$/g, '')
    .replace(/\\\(|\\\)/g, '')
    .replace(/\\\[|\\\]/g, '');

  return formatted;
}

/**
 * Cleans Markdown tags and converts LaTeX math formulas into readable text for PDF rendering
 */
function stripMarkdown(mdText) {
  if (!mdText) return '';
  const withReadableMath = formatLaTeXToReadableMath(mdText);

  return withReadableMath
    .replace(/!\[.*?\]\(.*?\)/g, '[Figure/Diagram]')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/`{1,3}.*?`{1,3}/gs, '')
    .replace(/[*_~#]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts image URLs from Markdown or HTML content
 */
function extractImageUrls(text) {
  if (!text) return [];
  const urls = [];

  const mdRegex = /!\[.*?\]\((.*?)\)/g;
  let match;
  while ((match = mdRegex.exec(text)) !== null) {
    if (match[1]) urls.push(match[1].trim());
  }

  const htmlRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  while ((match = htmlRegex.exec(text)) !== null) {
    if (match[1]) urls.push(match[1].trim());
  }

  return urls;
}

/**
 * Resizes and compresses image data URI using an offscreen canvas to keep PDF size under 5MB while preserving quality
 */
function compressImageToDataUrl(imgElement, maxDimension = 800, quality = 0.80) {
  try {
    const canvas = document.createElement('canvas');
    let width = imgElement.width || imgElement.naturalWidth || 800;
    let height = imgElement.height || imgElement.naturalHeight || 600;

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(imgElement, 0, 0, width, height);

    return canvas.toDataURL('image/jpeg', quality);
  } catch (err) {
    console.error('Error compressing image canvas:', err);
    return null;
  }
}

/**
 * Loads an image URL, compresses it, and converts it to a Data URL for optimized PDF embedding
 */
async function loadImageAsDataUrl(url) {
  try {
    let targetUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:') && !url.startsWith('blob:')) {
      const cleanPath = url.replace(/^[\.\/]+/, '');
      targetUrl = `https://raw.githubusercontent.com/amjadcp/iONMirror-Mocks/main/${cleanPath}`;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const compressedUri = compressImageToDataUrl(img, 800, 0.80);
        resolve(compressedUri);
      };
      img.onerror = () => {
        // Fallback to raw fetch if crossOrigin image fails
        fetch(targetUrl)
          .then(res => (res.ok ? res.blob() : null))
          .then(blob => {
            if (!blob) return resolve(null);
            const reader = new FileReader();
            reader.onloadend = () => {
              const fallbackImg = new Image();
              fallbackImg.onload = () => resolve(compressImageToDataUrl(fallbackImg, 800, 0.80));
              fallbackImg.onerror = () => resolve(reader.result);
              fallbackImg.src = reader.result;
            };
            reader.readAsDataURL(blob);
          })
          .catch(() => resolve(null));
      };
      img.src = targetUrl;
    });
  } catch (err) {
    console.error('Failed to load & compress image for PDF:', url, err);
    return null;
  }
}

/**
 * Generates a comprehensive multi-page PDF evaluation report (Optimized under 5MB)
 * Page 1: Detailed Overall Metrics & Section-wise Detailed Attempt & Time Breakdown
 * Pages 2+: Detailed Question-by-Question Evaluation, Options, Explanations, Images/Diagrams, and Time Taken
 */
export async function generatePDFReport({ state, candidateEmail }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true // Enables stream compression to optimize PDF file size
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const questionsList = Object.values(state.questionsById || {});
  const summary = state.submission?.summary || {};

  // Pre-fetch all images across questions, options, and explanations with parallel compression
  const imageCache = {};
  const imageFetchPromises = [];

  questionsList.forEach(q => {
    const urls = [
      ...extractImageUrls(q.stemMarkdown),
      ...extractImageUrls(q.explanation),
      ...(q.options || []).flatMap(opt => extractImageUrls(opt.markdown))
    ];

    urls.forEach(u => {
      if (!imageCache[u]) {
        imageCache[u] = null;
        imageFetchPromises.push(
          loadImageAsDataUrl(u).then(dataUri => {
            if (dataUri) imageCache[u] = dataUri;
          })
        );
      }
    });
  });

  // Await all compressed image pre-fetches
  await Promise.all(imageFetchPromises);

  // Score & Attempts calculation
  let correctCount = 0;
  let wrongCount = 0;
  let totalScore = 0;
  let maxPossibleScore = 0;
  let totalTimeSpentSeconds = 0;

  questionsList.forEach(q => {
    const questionMarks = Number(q.marks) || 3;
    const timeSec = Number(q.timeSpentSeconds) || 0;
    maxPossibleScore += questionMarks;
    totalTimeSpentSeconds += timeSec;

    const selectedOptId = q.selected && q.selected[0];
    if (selectedOptId && q.correctAnswer) {
      const isCorrect = selectedOptId.toString().toLowerCase() === q.correctAnswer.toString().toLowerCase();
      if (isCorrect) {
        correctCount += 1;
        totalScore += questionMarks;
      } else {
        wrongCount += 1;
        totalScore -= 1; // standard negative mark
      }
    }
  });

  const totalAnswered = (summary.answered || 0) + (summary.answeredMarked || 0);
  const totalNotAttempted = summary.total ? (summary.total - totalAnswered) : 0;
  const accuracyPct = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  // -------------------------------------------------------------
  // PAGE 1: OVERALL METRICS & DETAILED SECTION ANALYSIS
  // -------------------------------------------------------------

  // Header Banner
  doc.setFillColor(30, 41, 59); // Dark Navy #1e293b
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('TCS iON CBT Practice Examination Report', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Detailed Candidate Performance Analysis & Solution Key', 14, 21);

  // Metadata Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 33, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Candidate Email:`, 18, 41);
  doc.setFont('helvetica', 'normal');
  doc.text(candidateEmail || 'N/A', 50, 41);

  doc.setFont('helvetica', 'bold');
  doc.text(`Session ID:`, 18, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(state.sessionId || 'sess_practice', 50, 48);

  doc.setFont('helvetica', 'bold');
  doc.text(`Report Date:`, 120, 41);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }), 145, 41);

  doc.setFont('helvetica', 'bold');
  doc.text(`Total Time Spent:`, 120, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(formatTimeSpent(totalTimeSpentSeconds), 145, 48);

  // Section Heading: Overall Performance Summary
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Overall Performance & Evaluation Metrics', 14, 67);

  // Metrics Table
  const metricsData = [
    ['Final Score', `${totalScore} / ${maxPossibleScore} Marks`],
    ['Total Questions', `${summary.total || questionsList.length}`],
    ['Answered Questions', `${totalAnswered}`],
    ['Correct Answers', `${correctCount}`],
    ['Wrong Attempts', `${wrongCount}`],
    ['Not Attempted', `${totalNotAttempted}`],
    ['Overall Accuracy', `${accuracyPct}%`]
  ];

  autoTable(doc, {
    startY: 71,
    margin: { left: 14, right: 14 },
    head: [['Metric Parameter', 'Candidate Value']],
    body: metricsData,
    theme: 'grid',
    headStyles: { fillColor: [43, 108, 176], textColor: 255, fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [241, 245, 249] }
  });

  let currentY = doc.lastAutoTable.finalY + 12;

  // Section Heading: Detailed Section-wise Analysis
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Detailed Section-wise Attempt & Time Analysis', 14, currentY);

  // Detailed Section-wise Breakdown Calculation
  const detailedSectionMap = {};

  questionsList.forEach(q => {
    const secName = q.section || state.currentSection || 'General';
    if (!detailedSectionMap[secName]) {
      detailedSectionMap[secName] = {
        total: 0,
        answered: 0,
        correct: 0,
        wrong: 0,
        notAttempted: 0,
        marked: 0,
        score: 0,
        totalTimeSec: 0,
        correctTimeSec: 0,
        wrongTimeSec: 0
      };
    }

    const secData = detailedSectionMap[secName];
    secData.total += 1;

    const qMarks = Number(q.marks) || 3;
    const timeSec = Number(q.timeSpentSeconds) || 0;
    secData.totalTimeSec += timeSec;

    const selectedOptId = q.selected && q.selected[0];

    if (q.status === 'answered' || q.status === 'answered_marked') {
      secData.answered += 1;
    } else if (q.status === 'marked') {
      secData.marked += 1;
    } else {
      secData.notAttempted += 1;
    }

    if (selectedOptId && q.correctAnswer) {
      const isCorrect = selectedOptId.toString().toLowerCase() === q.correctAnswer.toString().toLowerCase();
      if (isCorrect) {
        secData.correct += 1;
        secData.score += qMarks;
        secData.correctTimeSec += timeSec;
      } else {
        secData.wrong += 1;
        secData.score -= 1; // standard negative mark
        secData.wrongTimeSec += timeSec;
      }
    }
  });

  const detailedSectionRows = Object.entries(detailedSectionMap).map(([secName, data]) => {
    const avgTimeCorrect = data.correct > 0 ? formatTimeSpent(Math.round(data.correctTimeSec / data.correct)) : '—';
    const avgTimeWrong = data.wrong > 0 ? formatTimeSpent(Math.round(data.wrongTimeSec / data.wrong)) : '—';
    const timeSpent = formatTimeSpent(data.totalTimeSec);

    return [
      secName,
      data.total,
      data.correct,
      data.wrong,
      data.notAttempted,
      `${data.score}`,
      timeSpent,
      avgTimeCorrect,
      avgTimeWrong
    ];
  });

  autoTable(doc, {
    startY: currentY + 4,
    margin: { left: 14, right: 14 },
    head: [['Section Name', 'Total', 'Correct', 'Wrong', 'Not Ans', 'Score', 'Time Spent', 'Avg (Correct)', 'Avg (Wrong)']],
    body: detailedSectionRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 8.5, halign: 'center' },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 34, fontStyle: 'bold' },
      1: { cellWidth: 12, halign: 'center' },
      2: { cellWidth: 14, halign: 'center', textColor: [39, 103, 73], fontStyle: 'bold' },
      3: { cellWidth: 14, halign: 'center', textColor: [197, 48, 48], fontStyle: 'bold' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 22, halign: 'center' },
      7: { cellWidth: 28, halign: 'center' },
      8: { cellWidth: 28, halign: 'center' }
    }
  });

  // Footer Note on Page 1
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'italic');
  doc.text('Generated by TCS iON CBT Lab Simulator. Page 1 of Performance & Evaluation Report.', 14, pageHeight - 10);

  // -------------------------------------------------------------
  // PAGES 2+: QUESTION-BY-QUESTION DETAILED EVALUATION & TIME SPENT
  // -------------------------------------------------------------

  doc.addPage();

  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('3. Detailed Question-by-Question Evaluation & Explanations', 14, 13);

  // Map question data and attach cached compressed base64 image data
  const questionTableRows = questionsList.map((q, idx) => {
    const qNum = `Q${idx + 1}`;
    const cleanStem = stripMarkdown(q.stemMarkdown);
    const selectedOptId = q.selected && q.selected[0];
    
    // Find pre-loaded compressed image
    const stemImageUrls = extractImageUrls(q.stemMarkdown);
    const stemBase64 = stemImageUrls.length > 0 ? imageCache[stemImageUrls[0]] : null;
    
    // Format options list with selection indicators
    const optionsText = (q.options || []).map(opt => {
      const optKey = opt.key || opt.id;
      const optClean = stripMarkdown(opt.markdown);
      const isSelected = selectedOptId && (selectedOptId.toString().toLowerCase() === optKey.toString().toLowerCase() || selectedOptId.toString().toLowerCase() === opt.id.toString().toLowerCase());
      const isCorrect = q.correctAnswer && (q.correctAnswer.toString().toLowerCase() === optKey.toString().toLowerCase() || q.correctAnswer.toString().toLowerCase() === opt.id.toString().toLowerCase());
      
      let badge = '';
      if (isSelected && isCorrect) badge = ' [Selected & Correct]';
      else if (isSelected) badge = ' [Selected]';
      else if (isCorrect) badge = ' [Correct Answer]';

      return `(${optKey}) ${optClean}${badge}`;
    }).join('\n');

    let statusText = 'Not Attempted';
    if (selectedOptId && q.correctAnswer) {
      const isCorrect = selectedOptId.toString().toLowerCase() === q.correctAnswer.toString().toLowerCase();
      statusText = isCorrect ? 'CORRECT' : 'WRONG';
    } else if (selectedOptId) {
      statusText = 'ANSWERED';
    }

    const timeSpent = formatTimeSpent(q.timeSpentSeconds || 0);
    const explanationText = q.explanation ? stripMarkdown(q.explanation) : 'No additional explanation available.';

    const detailCombined = `OPTIONS:\n${optionsText}\n\nEXPLANATION:\n${explanationText}`;

    return {
      qNum,
      cleanStem,
      detailCombined,
      statusText,
      timeSpent,
      stemBase64
    };
  });

  const formattedTableData = questionTableRows.map(r => [
    r.qNum,
    r.cleanStem + (r.stemBase64 ? '\n\n[Figure/Diagram Included Below]' : ''),
    r.detailCombined,
    r.statusText,
    r.timeSpent
  ]);

  autoTable(doc, {
    startY: 25,
    margin: { left: 14, right: 14 },
    head: [['Q#', 'Question Stem', 'Options & Detailed Explanation', 'Status', 'Time Spent']],
    body: formattedTableData,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59], cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 12, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 55 },
      2: { cellWidth: 80 },
      3: { cellWidth: 22, fontStyle: 'bold', halign: 'center' },
      4: { cellWidth: 20, halign: 'center' }
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 3) {
        if (data.cell.raw === 'CORRECT') {
          data.cell.styles.textColor = [39, 103, 73];
        } else if (data.cell.raw === 'WRONG') {
          data.cell.styles.textColor = [197, 48, 48];
        }
      }
    },
    didDrawCell: function(data) {
      // Draw compressed JPEG diagram images inside the Question Stem column if present
      if (data.section === 'body' && data.column.index === 1) {
        const rowData = questionTableRows[data.row.index];
        if (rowData && rowData.stemBase64) {
          try {
            const imgX = data.cell.x + 2;
            const imgY = data.cell.y + data.cell.height - 28;
            const imgWidth = Math.min(48, data.cell.width - 4);
            const imgHeight = 24;

            doc.addImage(rowData.stemBase64, 'JPEG', imgX, imgY, imgWidth, imgHeight, undefined, 'FAST');
          } catch (e) {
            console.error('Error rendering compressed image in PDF table cell:', e);
          }
        }
      }
    }
  });

  // Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'italic');
    doc.text(`iON Mirror CBT Lab Practice Session Report - Page ${i} of ${totalPages}`, 14, pageHeight - 10);
  }

  // Return clean base64 string and blob
  const dataUri = doc.output('datauristring');
  const pdfBase64 = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;
  const pdfBlob = doc.output('blob');

  return {
    pdfBase64,
    pdfBlob
  };
}
