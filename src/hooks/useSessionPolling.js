import { useEffect, useRef } from 'react';

export function useSessionPolling(sessionId, submitted, dispatch) {
  const lastUpdatedRef = useRef(null);

  useEffect(() => {
    if (!sessionId || submitted) return;

    // Check if questions were loaded directly in browser (from GitHub / catalog)
    const clientQuestionsRaw = sessionStorage.getItem(`ion_client_questions_${sessionId}`);
    if (clientQuestionsRaw) {
      try {
        const clientQuestions = JSON.parse(clientQuestionsRaw);
        if (Array.isArray(clientQuestions) && clientQuestions.length > 0) {
          dispatch({
            type: 'MERGE_QUESTIONS',
            payload: { questions: clientQuestions }
          });
          return; // Fully handled in browser! No Netlify Blob polling needed.
        }
      } catch (e) {
        console.error('Error parsing client-side questions:', e);
      }
    }

    let active = true;
    let timerId = null;

    const poll = async () => {
      try {
        const sinceParam = lastUpdatedRef.current ? `?since=${encodeURIComponent(lastUpdatedRef.current)}` : '';
        const res = await fetch(`/api/poll/${sessionId}${sinceParam}`);
        if (!res.ok) throw new Error(`Poll status: ${res.status}`);

        const data = await res.json();
        if (!active) return;

        if (data.questions && data.questions.length > 0) {
          dispatch({
            type: 'MERGE_QUESTIONS',
            payload: { questions: data.questions }
          });
        }
        if (data.updatedAt) {
          lastUpdatedRef.current = data.updatedAt;
        }
      } catch (err) {
        console.error('Session polling error:', err);
      } finally {
        if (active && !submitted) {
          timerId = setTimeout(poll, 2500);
        }
      }
    };

    poll();

    return () => {
      active = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [sessionId, submitted, dispatch]);
}
