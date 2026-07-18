import { getSessionStore } from './_lib/blobStore.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const sessionId = context.params.sessionId;
  const url = new URL(req.url);
  const since = url.searchParams.get('since');

  if (!sessionId) {
    return new Response('Missing sessionId', { status: 400, headers: CORS_HEADERS });
  }

  try {
    const store = getSessionStore();
    const data = await store.get(sessionId);
    if (!data) {
      return new Response(JSON.stringify({ questions: [], updatedAt: null }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    let filteredQuestions = data.questions;
    if (since) {
      const sinceTime = isNaN(since) ? Date.parse(since) : Number(since);
      if (!isNaN(sinceTime)) {
        filteredQuestions = data.questions.filter(q => q.receivedAt > sinceTime);
      }
    }

    return new Response(
      JSON.stringify({
        questions: filteredQuestions,
        updatedAt: data.updatedAt,
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Poll error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
};

export const config = { path: '/api/poll/:sessionId' };
