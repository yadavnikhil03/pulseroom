const apiURL = typeof window !== 'undefined'
  ? window._env_?.apiURL || process.env.REACT_APP_API_URL || 'http://localhost:8888'
  : 'http://localhost:8888';

let sessionId = null;
let pageStart = 0;

const getSessionId = () => {
  if (!sessionId) {
    sessionId = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }
  return sessionId;
};

const analytics = {
  pageView(page) {
    pageStart = Date.now();
    const entry = {
      type: 'pageview',
      session: getSessionId(),
      page,
      timestamp: new Date().toISOString(),
      ua: navigator.userAgent?.slice(0, 120),
      screen: `${window.innerWidth}x${window.innerHeight}`,
    };
    console.log('[Analytics]', JSON.stringify(entry));
  },

  event(category, action, label = '') {
    const entry = {
      type: 'event',
      session: getSessionId(),
      category,
      action,
      label,
      timestamp: new Date().toISOString(),
    };
    console.log('[Analytics]', JSON.stringify(entry));
  },

  timeOnPage() {
    const elapsed = Date.now() - pageStart;
    const entry = {
      type: 'timing',
      session: getSessionId(),
      duration: elapsed,
      timestamp: new Date().toISOString(),
    };
    console.log('[Analytics]', JSON.stringify(entry));
    return elapsed;
  },

  error(error) {
    const entry = {
      type: 'error',
      session: getSessionId(),
      message: error?.message || String(error),
      stack: error?.stack?.slice(0, 200),
      timestamp: new Date().toISOString(),
    };
    console.log('[Analytics]', JSON.stringify(entry));
  },
};

export default analytics;
