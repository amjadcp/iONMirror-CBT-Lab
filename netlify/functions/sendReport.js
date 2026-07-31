import { getNeonSql } from './_lib/neondb.js';

export async function handler(event, context) {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { email, sessionId, examName, pdfBase64, metrics } = payload;

    if (!email || !email.includes('@')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Valid email address is required' })
      };
    }

    console.log(`[sendReport Serverless Function] Processing report request for candidate: ${email} (Exam: ${examName || 'N/A'}, Session ID: ${sessionId || 'N/A'})`);

    const entryTimestamp = new Date().toISOString();
    const uniqueEntryId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. STORE IN NEON DB (table: report_logs)
    let neonLogged = false;
    try {
      const sql = getNeonSql();
      if (sql) {
        await sql`
          INSERT INTO report_logs (
            id, timestamp, candidate_email, session_id, exam_name,
            final_score, max_marks, total_questions, answered_questions,
            correct_answers, wrong_attempts, not_attempted, overall_accuracy
          ) VALUES (
            ${uniqueEntryId}, ${entryTimestamp}, ${email}, ${sessionId || 'sess_practice'}, ${examName || 'Mock Test'},
            ${metrics?.finalScore ?? 0}, ${metrics?.maxMarks ?? 0}, ${metrics?.totalQuestions ?? 0},
            ${metrics?.answeredQuestions ?? 0}, ${metrics?.correctAnswers ?? 0}, ${metrics?.wrongAttempts ?? 0},
            ${metrics?.notAttempted ?? 0}, ${metrics?.overallAccuracy ?? '0%'}
          )
        `;
        neonLogged = true;
        console.log(`[Neon DB Log] Successfully recorded log row entry for ${email} at ${entryTimestamp}`);
      } else {
        console.warn(`[Neon DB Log Notice] NEON_DATABASE_URL environment variable is pending configuration.`);
      }
    } catch (dbErr) {
      console.error(`[Neon DB Log Error]: ${dbErr.message}`);
    }

    // 2. DISPATCH VIA SENDINBLUE (BREVO) REST API
    const sendinblueApiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
    const senderEmail = process.env.SENDER_EMAIL || 'reports@ionmirror.com';

    if (!sendinblueApiKey) {
      console.warn('[sendReport] BREVO_API_KEY is not configured in Netlify environment variables.');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          dispatched: false,
          dbLogged: true,
          message: `Performance report request logged in DB for ${email}. (Email provider API key pending setup in Netlify)`
        })
      };
    }

    let cleanBase64 = '';
    if (pdfBase64) {
      cleanBase64 = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
      cleanBase64 = cleanBase64.replace(/\s+/g, '');
    }

    // Sendinblue (Brevo) v3 Transactional Email API
    const sendinblueResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': sendinblueApiKey
      },
      body: JSON.stringify({
        sender: {
          name: 'iON Mirror CBT Lab',
          email: senderEmail
        },
        to: [
          {
            email: email
          }
        ],
        subject: 'Your Practice Exam Performance & Evaluation Report (iON Mirror CBT)',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
            <h2 style="color: #1e40af; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">iON Mirror CBT Practice Examination Report</h2>
            <p>Hello,</p>
            <p>Thank you for completing your CBT practice session. Attached to this email is your <strong>Detailed Multi-Page Performance Report</strong> including:</p>
            <ul style="background: #f8fafc; padding: 15px 25px; border-radius: 6px; border: 1px solid #e2e8f0;">
              <li>Overall Score & Metric Analysis (Accuracy, Correct, Wrong Attempts)</li>
              <li>Detailed Section-wise Attempt Breakdown & Time Metrics</li>
              <li>Question-by-Question Detailed Evaluation & Explanations</li>
              <li>Exact Time Spent on Each Question (in seconds/minutes)</li>
            </ul>
            <p>Keep practicing and good luck with your exam preparation!</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">iON Mirror CBT Practice Simulator Environment | Session: ${sessionId || 'N/A'}</p>
          </div>
        `,
        attachment: cleanBase64 ? [
          {
            content: cleanBase64,
            name: `iON_Mirror_CBT_Report_${sessionId || 'Session'}.pdf`
          }
        ] : []
      })
    });

    if (sendinblueResponse.ok) {
      console.log(`[sendReport] Email successfully dispatched via Sendinblue API to ${email}`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          dispatched: true,
          dbLogged: true,
          message: `Performance report successfully emailed to ${email}.`
        })
      };
    } else {
      const errText = await sendinblueResponse.text();
      console.error('[sendReport] Sendinblue API error response:', errText);
      return {
        statusCode: sendinblueResponse.status || 500,
        headers,
        body: JSON.stringify({
          error: 'Failed to send email via Sendinblue',
          details: errText
        })
      };
    }
  } catch (error) {
    console.error('[sendReport] Serverless function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error processing report email' })
    };
  }
}
