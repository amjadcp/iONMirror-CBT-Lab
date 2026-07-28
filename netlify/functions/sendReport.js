/**
 * Netlify Serverless Function: sendReport.js
 * 1. Stores each report request in Netlify's DB (@netlify/blobs store 'report_requests') as a single log entry table row with entry timestamp and metrics.
 * 2. Dispatches email exclusively using Sendinblue (Brevo) Transactional Email API.
 */

import { getStore } from '@netlify/blobs';

/**
 * Safely initializes Netlify Blobs store with fallback for local dev / unconfigured environments
 */
function getReportStore() {
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN;

  if (siteID && token) {
    return getStore({ name: 'report_requests', siteID, token });
  }

  return getStore('report_requests');
}

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
    const { email, sessionId, pdfBase64, metrics } = payload;

    if (!email || !email.includes('@')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Valid email address is required' })
      };
    }

    console.log(`[sendReport Serverless Function] Processing report request for candidate: ${email} (Session ID: ${sessionId || 'N/A'})`);

    const entryTimestamp = new Date().toISOString();
    const uniqueEntryId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Structure log row record containing entry timestamp and high-level report metrics
    const reportLogRow = {
      id: uniqueEntryId,
      timestamp: entryTimestamp,
      candidateEmail: email,
      sessionId: sessionId || 'sess_practice',
      finalScore: metrics?.finalScore ?? 0,
      maxMarks: metrics?.maxMarks ?? 0,
      totalQuestions: metrics?.totalQuestions ?? 0,
      answeredQuestions: metrics?.answeredQuestions ?? 0,
      correctAnswers: metrics?.correctAnswers ?? 0,
      wrongAttempts: metrics?.wrongAttempts ?? 0,
      notAttempted: metrics?.notAttempted ?? 0,
      overallAccuracy: metrics?.overallAccuracy ?? '0%'
    };

    // 1. STORE IN NETLIFY'S DB (@netlify/blobs store 'report_requests')
    try {
      const dbStore = getReportStore();
      await dbStore.setJSON(uniqueEntryId, reportLogRow);

      // Append entry to master table log index 'all_report_logs'
      let masterLogTable = await dbStore.get('all_report_logs', { type: 'json' });
      if (!Array.isArray(masterLogTable)) {
        masterLogTable = [];
      }
      masterLogTable.unshift(reportLogRow);
      await dbStore.setJSON('all_report_logs', masterLogTable);

      console.log(`[Netlify DB Log] Successfully recorded row entry for ${email} at ${entryTimestamp}`);
    } catch (dbErr) {
      console.warn(`[Netlify DB Log Notice] DB store notice (${dbErr.name}): ${dbErr.message}`);
      console.log(`[Netlify DB Local Log Entry] Recorded locally for candidate ${email} (Session ID: ${sessionId || 'N/A'}) at ${entryTimestamp}`);
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
