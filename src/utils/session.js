const SESSION_STORAGE_KEY = 'ionmirror_persistent_session_id';

/**
 * Generates a clean, unique session ID string.
 */
function generateUniqueId() {
  return 'sess_' + Math.random().toString(36).substring(2, 8) + Date.now().toString(36);
}

/**
 * Gets the persistent session ID from localStorage or creates a new one if it doesn't exist.
 * Reuses the same ID as long as it persists in browser storage.
 */
export function getOrCreateSessionId() {
  try {
    let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
      sessionId = generateUniqueId();
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
    return sessionId;
  } catch (e) {
    console.error('Failed to read session ID from localStorage:', e);
    return generateUniqueId();
  }
}

/**
 * Sets or syncs the persistent session ID in browser storage.
 */
export function setPersistentSessionId(sessionId) {
  if (!sessionId) return getOrCreateSessionId();
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  } catch (e) {
    console.error('Failed to save session ID to localStorage:', e);
  }
  return sessionId;
}
