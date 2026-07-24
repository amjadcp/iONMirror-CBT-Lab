import { getSessionStore } from './_lib/blobStore.js';
import { validateQuestionPayload } from './_lib/schema.js';
import { parseQuestionsFromRaw } from '../../src/utils/questionParser.js';

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
    const bodyText = await req.text().catch(() => null);
    let parsedBody = null;
    try {
      parsedBody = JSON.parse(bodyText);
    } catch {
      parsedBody = bodyText; // Raw markdown text payload
    }

    const { valid, errors, data } = validateQuestionPayload(parsedBody);
    if (!valid) {
      return new Response(JSON.stringify({ errors }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const { questions: parsedQuestions } = parseQuestionsFromRaw(data);

    const store = getSessionStore();
    const existing = (await store.get(sessionId)) || { sessionId, questions: [], updatedAt: null };

    const now = Date.now();
    const stampedQuestions = parsedQuestions.map(q => ({
      ...q,
      receivedAt: now
    }));

    existing.questions.push(...stampedQuestions);
    existing.updatedAt = new Date().toISOString();

    // TTL: session data self-expires after 3 hours of inactivity
    await store.setJSON(sessionId, existing, {
      metadata: { expiresAt: Date.now() + 3 * 60 * 60 * 1000 },
    });

    return new Response(JSON.stringify({ received: stampedQuestions.length, questions: stampedQuestions }), {
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
