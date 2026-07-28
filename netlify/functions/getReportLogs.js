/**
 * Netlify Serverless Function: getReportLogs.js
 * Retrieves all recorded report request log rows from Netlify's DB (@netlify/blobs store 'report_requests').
 */

import { getStore } from '@netlify/blobs';

function getReportStore() {
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN;

  if (siteID && token) {
    return getStore({ name: 'report_requests', siteID, token });
  }

  return getStore('report_requests');
}

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const dbStore = getReportStore();
    let logs = await dbStore.get('all_report_logs', { type: 'json' });

    if (!Array.isArray(logs)) {
      logs = [];
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        totalRequestsLogged: logs.length,
        logs
      })
    };
  } catch (error) {
    console.error('[getReportLogs] Error fetching logs from Netlify DB:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch DB logs', details: error.message })
    };
  }
}
