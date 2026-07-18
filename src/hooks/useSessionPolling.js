import { useEffect, useRef } from 'react';

export function useSessionPolling(sessionId, submitted, dispatch) {
  const lastUpdatedRef = useRef(null);

  useEffect(() => {
    if (!sessionId || submitted) return;

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
