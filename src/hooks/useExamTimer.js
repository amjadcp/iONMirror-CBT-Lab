import { useEffect } from 'react';

export function useExamTimer(timerState, dispatch) {
  const { remainingSeconds, isRunning, isExpired } = timerState;

  useEffect(() => {
    if (!isRunning || isExpired) return;

    if (remainingSeconds <= 0) {
      dispatch({ type: 'EXPIRE_TIMER' });
      return;
    }

    const intervalId = setInterval(() => {
      dispatch({ type: 'UPDATE_TIMER' });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning, isExpired, remainingSeconds, dispatch]);
}
