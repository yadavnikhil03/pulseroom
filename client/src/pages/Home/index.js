import React, { useState, useEffect } from 'react';
import queryString from 'query-string';
import { Link } from 'react-router-dom';

import Navbar from '../../components/Navbar';
import { useAuth } from '../../hooks/AuthContext';
import { useToast } from '../../components/Toast';
import { setAccessToken } from '../../utils/authApi';
import spotifyAuth from '../../utils/spotifyAuth';
import SpotifyAPI from '../../utils/SpotifyAPI';
import API from '../../utils/API';
import './style.css';

const Home = () => {
  const { user: accountUser, logout: accountLogout } = useAuth();
  const { addToast } = useToast();
  const [spotifyUser, setSpotifyUser] = useState(null);
  const [playlists, setPlaylists] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentRooms, setRecentRooms] = useState([]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const parsedURL = queryString.parse(window.location.search);

  const bootstrap = async () => {
    try {
      // Handle Google auth redirect
      if (parsedURL.google_auth === '1' && parsedURL.accessToken && parsedURL.refreshToken) {
        setGoogleLoading(true);
        setAccessToken(parsedURL.accessToken);
        // Clean URL
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
        addToast('Connected with Google', 'success');
      }

      if (parsedURL.error) {
        const errorType = parsedURL.error === 'access_denied'
          ? 'You declined the Spotify connection.'
          : 'An authentication error occurred.';
        addToast(errorType, 'warning');
        return setAuthError(errorType);
      }
      const { data: user } = await SpotifyAPI.getUserData();
      if (!user.id) throw new Error('Could not load Spotify user profile.');
      const profile = { name: user.display_name || user.id, id: user.id, url: user.external_urls?.spotify, image: user.images?.[0]?.url };
      setSpotifyUser(profile);
      addToast('Connected to Spotify', 'success');

      const { data: playlistData } = await SpotifyAPI.getUserPlaylists(50);
      setPlaylists(playlistData?.items || []);

      const { data: playerData } = await SpotifyAPI.getDevices();
      setPlayerReady(Boolean(playerData?.devices?.some(d => d.is_active)));

      // Fetch recent rooms (last 10)
      API.getRooms().then(({ data }) => {
        if (Array.isArray(data)) {
          setRecentRooms(data.slice(-10).reverse());
        }
      }).catch(() => {});
    } catch (error) {
      if (error.response?.status === 401) return spotifyAuth.logout();
      setAuthError(error.response?.data?.message || error.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!spotifyUser && !authError) bootstrap();
  }, [spotifyUser, authError]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className='demo-lobby is-loading' aria-label='Loading Spotify dashboard'>
        <div className='demo-lobby-ambient' aria-hidden='true' />
        <div className='pulseroom-loader-container'>
          {[...Array(5)].map((_, i) => <div key={i} className='pulseroom-bar' />)}
        </div>
        <h1 className='loading-text-header'>Connecting to Pulseroom…</h1>
        <p>Authenticating your Spotify session and preparing the lobby.</p>
      </div>
      </>
    );
  }

  if (authError) {
    return (
      <>
        <Navbar />
        <div className='demo-lobby is-error' aria-live='polite'>
        <div className='demo-lobby-ambient' aria-hidden='true' />
        <div className='auth-error-icon' aria-hidden='true'>
          <svg viewBox='0 0 24 24'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z' /></svg>
        </div>
        <h1>Connection failed</h1>
        <p>{authError}</p>
        <a href='/' className='demo-nav-link'>Back to home page</a>
      </div>
      </>
    );
  }

  if (spotifyUser) {
    return (
      <>
        <Navbar />
        <div className="home-container">
        <div className="home-hero">
          <h1 className="home-banner">
            Welcome, <span className="welcome-username">{spotifyUser.name}</span>
          </h1>
          <p className="home-subtitle">
            {accountUser ? `Signed in as ${accountUser.name} · ` : ''}
            Create a listening room, share the link, and enjoy music together.
          </p>
          <div className="home-actions">
            <Link to="/create" className="home-action-btn">
              Start a Room
            </Link>
            <Link to="/room" className="home-action-btn home-action-secondary">
              Join a Room
            </Link>
          </div>
          <div className="home-account-info">
            {accountUser && (
              <span>
                {accountUser.name} · <button onClick={accountLogout} className="home-logout-btn">Sign out</button>
              </span>
            )}
          </div>

          {/* Connection Status */}
          <div className="home-status">
            <div className={`home-status-badge ${playerReady ? 'is-ready' : ''}`}>
              <span className="home-status-dot" />
              <span>{playerReady ? 'Active' : 'No active'} Spotify device</span>
            </div>
            <div className="home-status-badge is-connected">
              <span className="home-status-dot" />
              <span>Spotify connected</span>
            </div>
          </div>
        </div>

        {/* Recent Rooms */}
        {recentRooms.length > 0 && (
          <div className="home-recent-rooms">
            <h2 className="home-section-title">Recent Rooms</h2>
            <div className="home-rooms-grid">
              {recentRooms.map((room) => (
                <Link to={`/room?id=${room.room_id}`} key={room.room_id} className="home-room-card">
                  <div className="home-room-card-glow" />
                  <h3 className="home-room-card-title">{room.title || 'Untitled Room'}</h3>
                  <span className="home-room-card-id">{room.room_id}</span>
                  <span className="home-room-card-arrow">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      </>
    );
  }

  return null;
};

export default Home;
