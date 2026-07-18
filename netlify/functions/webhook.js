import { getSessionStore } from './_lib/blobStore.js';
import { validateQuestionPayload } from './_lib/schema.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const sessionId = context.params.sessionId;
  if (!sessionId) {
    return new Response('Missing sessionId', { status: 400, headers: CORS_HEADERS });
  }

  try {
    const body = await req.json().catch(() => null);
    const { valid, errors, data } = validateQuestionPayload(body);
    if (!valid) {
      return new Response(JSON.stringify({ errors }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const store = getSessionStore();
    const existing = (await store.get(sessionId)) || { sessionId, questions: [], updatedAt: null };

    const now = Date.now();
    const stampedQuestions = data.questions.map(q => ({
      ...q,
      receivedAt: now
    }));

    existing.questions.push(...stampedQuestions);
    existing.updatedAt = new Date().toISOString();

    // TTL: session data self-expires after 3 hours of inactivity
    await store.setJSON(sessionId, existing, {
      metadata: { expiresAt: Date.now() + 3 * 60 * 60 * 1000 },
    });

    return new Response(JSON.stringify({ received: stampedQuestions.length }), {
      status: 202,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
};

export const config = { path: '/api/webhook/:sessionId' };
