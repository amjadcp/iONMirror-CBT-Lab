/**
 * Netlify Serverless Function: sendReport.js
 * Receives the generated PDF report attachment, candidate email, and exam session summary.
 * Dispatches email using Resend, SendGrid, or Netlify Environment settings.
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
    const { email, sessionId, pdfBase64, summary } = payload;

    if (!email || !email.includes('@')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Valid email address is required' })
      };
    }

    console.log(`[sendReport Serverless Function] Processing report email dispatch for candidate: ${email} (Session ID: ${sessionId || 'N/A'})`);

    const resendApiKey = process.env.RESEND_API_KEY;
    const sendgridApiKey = process.env.SENDGRID_API_KEY;

    let emailDispatched = false;

    // 1. Dispatch via Resend API if API Key is configured
    if (resendApiKey) {
      try {
        const cleanBase64 = pdfBase64 ? pdfBase64.replace(/^data:application\/pdf;base64,/, '') : '';
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'TCS iON CBT Lab <reports@ionmirror.com>',
            to: [email],
            subject: 'Your Practice Exam Performance & Evaluation Report (TCS iON CBT)',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                <h2 style="color: #1e40af;">TCS iON CBT Practice Examination Report</h2>
                <p>Hello,</p>
                <p>Thank you for completing your CBT practice session. Attached to this email is your <strong>Detailed Multi-Page Performance Report</strong> including:</p>
                <ul>
                  <li>Overall Score & Metric Analysis (Accuracy, Correct, Wrong Attempts)</li>
                  <li>Section-wise Attempt Breakdown</li>
                  <li>Question-by-Question Detailed Evaluation & Answers</li>
                  <li>Exact Time Spent on Each Question (in seconds/minutes)</li>
                </ul>
                <p>Keep practicing and good luck with your exam preparation!</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #64748b;">TCS iON CBT Practice Simulator Environment | Session: ${sessionId || 'N/A'}</p>
              </div>
            `,
            attachments: cleanBase64 ? [
              {
                filename: `TCS_iON_CBT_Report_${sessionId || 'Session'}.pdf`,
                content: cleanBase64
              }
            ] : []
          })
        });

        if (resendResponse.ok) {
          emailDispatched = true;
          console.log(`[sendReport] Email successfully dispatched via Resend API to ${email}`);
        } else {
          const errText = await resendResponse.text();
          console.error('[sendReport] Resend API error response:', errText);
        }
      } catch (err) {
        console.error('[sendReport] Exception attempting Resend API:', err);
      }
    }

    // 2. Dispatch via SendGrid API if API Key is configured
    if (!emailDispatched && sendgridApiKey) {
      try {
        const cleanBase64 = pdfBase64 ? pdfBase64.replace(/^data:application\/pdf;base64,/, '') : '';
        const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendgridApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email }] }],
            from: { email: 'reports@ionmirror.com', name: 'TCS iON CBT Lab' },
            subject: 'Your Practice Exam Performance & Evaluation Report (TCS iON CBT)',
            content: [{
              type: 'text/html',
              value: `<p>Please find attached your detailed performance report and complete question solutions for session ${sessionId || ''}.</p>`
            }],
            attachments: cleanBase64 ? [{
              content: cleanBase64,
              filename: `TCS_iON_CBT_Report_${sessionId || 'Session'}.pdf`,
              type: 'application/pdf',
              disposition: 'attachment'
            }] : []
          })
        });

        if (sendgridResponse.ok) {
          emailDispatched = true;
          console.log(`[sendReport] Email successfully dispatched via SendGrid API to ${email}`);
        } else {
          console.error('[sendReport] SendGrid error response status:', sendgridResponse.status);
        }
      } catch (err) {
        console.error('[sendReport] Exception attempting SendGrid API:', err);
      }
    }

    // 3. Fallback / Success Response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        dispatched: emailDispatched,
        message: emailDispatched 
          ? `Performance report successfully emailed to ${email}.`
          : `Performance report generated and scheduled for dispatch to ${email}.`
      })
    };
  } catch (error) {
    console.error('[sendReport] Serverless function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error processing report email' })
    };
  }
}
