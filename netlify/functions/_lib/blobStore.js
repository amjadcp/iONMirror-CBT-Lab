import fs from 'fs';
import path from 'path';

let getStore;
try {
  // Dynamic import in case @netlify/blobs is not installed/loadable in all environments
  const blobs = await import('@netlify/blobs');
  getStore = blobs.getStore;
} catch (e) {
  // Silently ignore and fall back to local file storage
}

class LocalStore {
  constructor() {
    this.cacheDir = path.join(process.cwd(), '.cache');
    this.filePath = path.join(this.cacheDir, 'sessions.json');
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify({}));
    }
  }

  async get(key) {
    try {
      const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      const entry = data[key];
      if (!entry) return null;
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        delete data[key];
        fs.writeFileSync(this.filePath, JSON.stringify(data));
        return null;
      }
      return entry.value;
    } catch (e) {
      console.error('LocalStore get error:', e);
      return null;
    }
  }

  async setJSON(key, value, options) {
    try {
      const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      const expiresAt = options?.metadata?.expiresAt || (Date.now() + 3 * 60 * 60 * 1000);
      data[key] = { value, expiresAt };
      fs.writeFileSync(this.filePath, JSON.stringify(data));
    } catch (e) {
      console.error('LocalStore setJSON error:', e);
    }
  }
}

export function getSessionStore() {
  const isNetlify = !!(process.env.NETLIFY || process.env.NETLIFY_IMAGES_KEY || process.env.NETLIFY_BLOBS_CONTEXT);
  if (isNetlify && getStore) {
    try {
      const store = getStore('cbt-sessions');
      return {
        get: async (key) => store.get(key, { type: 'json' }),
        setJSON: async (key, val, options) => store.setJSON(key, val, options)
      };
    } catch (e) {
      console.warn('Netlify Blobs initialization failed, falling back to local store:', e.message);
    }
  }
  return new LocalStore();
}
