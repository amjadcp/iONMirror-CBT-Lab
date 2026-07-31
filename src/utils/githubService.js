import { parseMockTestFilename } from './questionParser';

const IS_LOCAL = import.meta.env.VITE_ENV === 'dev'
const LOCAL_MOCKS_API = '/dev-local-mocks';
const GITHUB_REPO_API = 'https://api.github.com/repos/amjadcp/iONMirror-Mocks/contents';

/**
 * Fetch the live list of mock test files.
 * Uses local /projects/iONMirror-Mocks folder in development mode (localhost),
 * and live GitHub repository (amjadcp/iONMirror-Mocks) in production mode.
 */
export async function fetchGitHubMockTests() {
  if (IS_LOCAL) {
    try {
      const res = await fetch(LOCAL_MOCKS_API);
      if (!res.ok) {
        throw new Error(`Local mock server error: ${res.statusText}`);
      }
      const files = await res.json();
      return files.map(file => {
        const meta = parseMockTestFilename(file.name);
        return {
          id: file.name,
          fileName: file.name,
          title: meta.title,
          questionsCount: meta.questionsCount || 10,
          durationMins: meta.durationMins || 10,
          downloadUrl: file.download_url
        };
      });
    } catch (localErr) {
      console.error('Error fetching local mock tests from /projects/iONMirror-Mocks:', localErr);
      return [];
    }
  }

  // Production ONLY (Deployed build): Fetch directly from GitHub repository API
  try {
    const res = await fetch(GITHUB_REPO_API);
    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.statusText}`);
    }

    const files = await res.json();
    
    // Filter test files (excluding README.md, hidden files, non-files)
    const mockFiles = files.filter(f => f.type === 'file' && f.name !== 'README.md' && !f.name.startsWith('.'));

    return mockFiles.map(file => {
      const meta = parseMockTestFilename(file.name);
      return {
        id: file.sha || file.name,
        fileName: file.name,
        title: meta.title,
        questionsCount: meta.questionsCount || 10,
        durationMins: meta.durationMins || 10,
        downloadUrl: file.download_url || `https://raw.githubusercontent.com/amjadcp/iONMirror-Mocks/main/${encodeURIComponent(file.name)}`
      };
    });
  } catch (err) {
    console.error('Error fetching mock tests from GitHub repo:', err);
    return [];
  }
}


