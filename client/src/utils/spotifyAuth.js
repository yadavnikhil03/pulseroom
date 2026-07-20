import axios from 'axios';
import { apiURL } from '../App.config';

let cachedToken = null;
let expiresAt = 0;
let pendingRequest = null;

const requestToken = async (refresh = false) => {
  const { data } = refresh
    ? await axios.post(`${apiURL}/api/spotify/refresh`, null, { withCredentials: true })
    : await axios.get(`${apiURL}/api/spotify/token`, { withCredentials: true });
  cachedToken = data.access_token;
  expiresAt = Number(data.expires_at || 0);
  return cachedToken;
};

const getAccessToken = async () => {
  if (cachedToken && Date.now() < expiresAt - 60_000) return cachedToken;
  if (!pendingRequest) {
    pendingRequest = requestToken(Boolean(cachedToken)).finally(() => { pendingRequest = null; });
  }
  return pendingRequest;
};

const clearAccessToken = () => {
  cachedToken = null;
  expiresAt = 0;
};

const logout = async () => {
  try {
    await axios.post(`${apiURL}/api/spotify/logout`, null, { withCredentials: true });
  } finally {
    clearAccessToken();
    window.location.assign('/');
  }
};

export default { getAccessToken, clearAccessToken, logout };
