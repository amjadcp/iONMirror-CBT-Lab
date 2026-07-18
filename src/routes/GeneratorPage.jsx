import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function GeneratorPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [examType, setExamType] = useState('AFCAT');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQuestions, setNumQuestions] = useState('10');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [showProceed, setShowProceed] = useState(false);

  // Sample templates to generate questions from
  const generateMockQuestions = (type, diff, count) => {
    const list = [];
    const num = parseInt(count, 10) || 10;

    for (let i = 1; i <= num; i++) {
      const qId = `q_${type.toLowerCase()}_${i}`;
      
      let section = 'Quantitative Aptitude';
      if (i > num * 0.75) {
        section = 'Technical / Core';
      } else if (i > num * 0.5) {
        section = 'General Reasoning';
      } else if (i > num * 0.25) {
        section = 'English Comprehension';
      }

      if (section === 'Quantitative Aptitude') {
        list.push({
          id: qId,
          section,
          type: 'single',
          marks: 3,
          negativeMarks: 1,
          stemMarkdown: `**[Q${i}]** A boat travels at a speed of $v$ km/h in still water. If the speed of the stream is $s$ km/h, the boat takes $t$ hours to go to a place and return. Calculate the distance $d$ in terms of $v, s$ and $t$.\n\nMathematical relation:\n$$d = \\frac{t(v^2 - s^2)}{2v}$$\n\nGiven that $v = 15\\text{ km/h}$, $s = 3\\text{ km/h}$ and $t = 5\\text{ hours}$, find the one-way distance:`,
          options: [
            { id: 'a', markdown: '36 km' },
            { id: 'b', markdown: '$36\\sqrt{2}$ km' },
            { id: 'c', markdown: '42 km' },
            { id: 'd', markdown: '72 km' }
          ]
        });
      } else if (section === 'General Reasoning') {
        list.push({
          id: qId,
          section,
          type: 'single',
          marks: 3,
          negativeMarks: 1,
          stemMarkdown: `**[Q${i}]** Complete the visual pattern sequence from the flowchart. Click on the diagram below to expand it if the scroll restricts viewing.\n\n\`\`\`mermaid\ngraph TD\n  Start([Input Pattern]) --> A[Rotate 90deg CW]\n  A --> B[Invert Colors]\n  B --> C[Flip Horizontally]\n  C --> End([Output Shape])\n\`\`\``,
          options: [
            { id: 'a', markdown: 'Diamond with inverted center shade' },
            { id: 'b', markdown: 'Rotated rectangle with default border' },
            { id: 'c', markdown: 'Flipped triangle' },
            { id: 'd', markdown: 'None of the above' }
          ]
        });
      } else if (section === 'English Comprehension') {
        list.push({
          id: qId,
          section,
          type: 'single',
          marks: 3,
          negativeMarks: 1,
          stemMarkdown: `**[Q${i}]** Choose the most appropriate synonym for the word underlined below:\n\n"The examiner remained *imperturbable* despite the technical glitches in the online exam center."`,
          options: [
            { id: 'a', markdown: 'Calm and collected' },
            { id: 'b', markdown: 'Excited and nervous' },
            { id: 'c', markdown: 'Uninterested' },
            { id: 'd', markdown: 'Angry' }
          ]
        });
      } else {
        list.push({
          id: qId,
          section,
          type: i % 2 === 0 ? 'multiple' : 'single',
          marks: i % 2 === 0 ? 2 : 1,
          negativeMarks: i % 2 === 0 ? 0 : 0.33,
          stemMarkdown: `**[Q${i}]** ${i % 2 === 0 ? 'Select all correct statements' : 'Evaluate the output'} for the logic gate design shown in the inline SVG:\n\n<svg viewBox="0 0 300 120" width="300" height="120" style="background: #ffffff; border: 1px solid #ccc; padding: 10px; border-radius: 4px; display: block; margin: 10px auto;">\n  <line x1="20" y1="40" x2="80" y2="40" stroke="#111" stroke-width="2" />\n  <text x="10" y="45" font-family="sans-serif" font-size="12" font-weight="bold">A</text>\n  <line x1="20" y1="80" x2="80" y2="80" stroke="#111" stroke-width="2" />\n  <text x="10" y="85" font-family="sans-serif" font-size="12" font-weight="bold">B</text>\n  <path d="M 80 30 L 100 30 A 30 30 0 0 1 100 90 L 80 90 Z" fill="none" stroke="#28a745" stroke-width="2" />\n  <text x="88" y="65" font-family="sans-serif" font-size="11" fill="#28a745" font-weight="bold">AND</text>\n  <line x1="130" y1="60" x2="200" y2="60" stroke="#111" stroke-width="2" />\n  <text x="210" y="65" font-family="sans-serif" font-size="12" font-weight="bold">Y</text>\n</svg>`,
          options: [
            { id: 'a', markdown: 'Output $Y$ evaluates to 1 if and only if both inputs $A$ and $B$ are 1.' },
            { id: 'b', markdown: 'The logic function is represented by $Y = A \\cdot B$.' },
            { id: 'c', markdown: 'It can be implemented using NAND gates only.' },
            { id: 'd', markdown: 'The logic gate behaves as an OR gate under active-low inputs.' }
          ]
        });
      }
    }
    return list;
  };

  const handleGenerate = async () => {
    if (!sessionId) {
      setStatus('Error: No session ID found in parameters.');
      return;
    }

    setLoading(true);
    setStatus('Generating exam questions...');

    const questions = generateMockQuestions(examType, difficulty, numQuestions);
    const payload = {
      sessionId,
      examType,
      difficulty,
      questions
    };

    try {
      const res = await fetch(`/api/webhook/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Server returned error status: ${res.status}`);
      }

      const data = await res.json();
      setStatus(`Success! Transmitted ${data.received} questions to the simulator.`);
      setShowProceed(true);
    } catch (err) {
      console.error(err);
      setStatus(`Delivery Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    navigate(`/session/${sessionId}/login`);
  };

  return (
    <div className="setup-container">
      <div className="setup-card" style={{ maxWidth: '480px' }}>
        <h2 className="setup-title" style={{ textAlign: 'center', marginBottom: '20px' }}>
          Quiz Generator Configuration
        </h2>
        <p className="setup-desc" style={{ textAlign: 'center', marginBottom: '20px' }}>
          Select your test parameters below to generate the questions payload.
        </p>

        <div className="setup-details">
          <div className="setup-field-group">
            <label>Target Exam</label>
            <select 
              value={examType} 
              onChange={(e) => setExamType(e.target.value)}
              style={{
                background: '#ffffff',
                border: '1px solid var(--cbt-border-color)',
                borderRadius: '4px',
                padding: '10px',
                fontSize: '12px',
                color: 'var(--cbt-text-main)',
                outline: 'none'
              }}
            >
              <option value="AFCAT">AFCAT (Indian Air Force)</option>
              <option value="GATE">GATE (Graduate Aptitude Test)</option>
              <option value="SSC">SSC CGL (Civil Services)</option>
              <option value="TA">Territorial Army (TA)</option>
            </select>
          </div>

          <div className="setup-field-group">
            <label>Difficulty Rating</label>
            <select 
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value)}
              style={{
                background: '#ffffff',
                border: '1px solid var(--cbt-border-color)',
                borderRadius: '4px',
                padding: '10px',
                fontSize: '12px',
                color: 'var(--cbt-text-main)',
                outline: 'none'
              }}
            >
              <option value="Easy">Easy (Practice)</option>
              <option value="Medium">Medium (Balanced)</option>
              <option value="Hard">Hard (TCS iON Standard)</option>
            </select>
          </div>

          <div className="setup-field-group">
            <label>Question Quantity</label>
            <select 
              value={numQuestions} 
              onChange={(e) => setNumQuestions(e.target.value)}
              style={{
                background: '#ffffff',
                border: '1px solid var(--cbt-border-color)',
                borderRadius: '4px',
                padding: '10px',
                fontSize: '12px',
                color: 'var(--cbt-text-main)',
                outline: 'none'
              }}
            >
              <option value="5">5 Questions (Rapid-fire)</option>
              <option value="10">10 Questions (Sectional)</option>
              <option value="20">20 Questions (Standard)</option>
              <option value="30">30 Questions (Full Test)</option>
            </select>
          </div>
        </div>

        <button 
          className="setup-btn" 
          onClick={handleGenerate} 
          disabled={loading}
          style={{ marginBottom: '15px' }}
        >
          {loading ? 'Transmitting Questions...' : 'Generate & Send Questions'}
        </button>

        {status && (
          <div 
            className={`gen-status ${status.startsWith('Success') ? 'success' : 'error'}`} 
            style={{ marginBottom: '15px', padding: '10px', borderRadius: '4px', fontSize: '11px', textAlign: 'center' }}
          >
            {status}
          </div>
        )}

        {showProceed && (
          <button 
            className="setup-btn" 
            onClick={handleProceed}
            style={{ background: '#38a169' }}
          >
            Proceed to Candidate Login ▶
          </button>
        )}
      </div>
    </div>
  );
}
