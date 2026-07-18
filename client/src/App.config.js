const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname) || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.');
const apiURL = process.env.REACT_APP_BACKEND_URL
  || (isLocal ? `http://${window.location.hostname}:8888` : window.location.origin);

export { apiURL };
