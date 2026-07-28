/**
 * Netlify Serverless Function: sendReport.js
 * Receives the generated PDF report attachment, candidate email, and exam session summary.
 * Dispatches email exclusively using Sendinblue (Brevo) Transactional Email API.
 */

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
    const { email, sessionId, pdfBase64 } = payload;

    if (!email || !email.includes('@')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Valid email address is required' })
      };
    }

    console.log(`[sendReport Serverless Function] Processing report email dispatch for candidate: ${email} (Session ID: ${sessionId || 'N/A'})`);

    const sendinblueApiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.SENDER_EMAIL || 'reports@ionmirror.com';

    if (!sendinblueApiKey) {
      console.warn('[sendReport] SENDINBLUE_API_KEY / BREVO_API_KEY is not configured in Netlify environment variables.');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          dispatched: false,
          message: `Performance report generated for ${email}. (Email provider API key pending setup in Netlify)`
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
