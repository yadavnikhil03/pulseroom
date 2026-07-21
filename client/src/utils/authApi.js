import axios from 'axios';
import { apiURL } from '../App.config';

let accessToken = null;
let refreshPromise = null;

const authApi = axios.create({ baseURL: `${apiURL}/api/auth`, withCredentials: true });
const accountApi = axios.create({ baseURL: `${apiURL}/api`, withCredentials: true });

export const setAccessToken = token => { accessToken = token || null; };
export const getAccessToken = () => accessToken;

const refreshSession = async () => {
  if (!refreshPromise) {
    refreshPromise = authApi.post('/refresh-token')
      .then(response => { setAccessToken(response.data.accessToken); return response; })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

accountApi.interceptors.request.use(config => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});
accountApi.interceptors.response.use(response => response, async error => {
  const request = error.config;
  if (error.response?.status !== 401 || request?._accountRetried) throw error;
  request._accountRetried = true;
  await refreshSession();
  request.headers.Authorization = `Bearer ${accessToken}`;
  return accountApi(request);
});

export const accountRequest = config => accountApi(config);
export const registerAccount = data => authApi.post('/register', data);
export const loginAccount = data => authApi.post('/login', data);
export const refreshAccount = refreshSession;
export const logoutAccount = () => authApi.post('/logout');

export default accountApi;
