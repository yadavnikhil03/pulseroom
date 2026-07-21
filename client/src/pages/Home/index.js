import React, { useState, useEffect } from 'react';
import queryString from 'query-string';
import { Link } from 'react-router-dom';

import Navbar from '../../components/Navbar';
import { useAuth } from '../../hooks/AuthContext';
import { useToast } from '../../components/Toast';
import { setAccessToken } from '../../utils/authApi';

import SpotifyAPI from '../../utils/SpotifyAPI';
import API from '../../utils/API';
import { apiURL } from '../../App.config';
import './style.css';

const Home = () => {
  const { user: accountUser, refresh: accountRefresh } = useAuth();
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
        await accountRefresh();
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
      if (error.response?.status === 401) {
        // No Spotify session — just show the connect prompt (don't redirect)
        setAuthError('spotify_not_connected');
        return;
      }
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
        <div className="home-page">
          <div className="bg-orb bg-orb-1" aria-hidden="true" />
          <div className="bg-orb bg-orb-2" aria-hidden="true" />
          <div className="bg-orb bg-orb-3" aria-hidden="true" />
          <div className="home-hero">
            <div className="pulseroom-loader-container">
              {[...Array(5)].map((_, i) => <div key={i} className="pulseroom-bar" />)}
            </div>
            <p style={{ textAlign: 'center', marginTop: 20, color: 'rgba(255,255,255,0.6)', fontSize: '0.92rem' }}>
              Connecting to Pulseroom&hellip;
            </p>
          </div>
        </div>
      </>
    );
  }

  if (authError === 'spotify_not_connected') {
    return (
      <>
        <Navbar />
        <div className="home-page">
          <div className="bg-orb bg-orb-1" aria-hidden="true" />
          <div className="bg-orb bg-orb-2" aria-hidden="true" />
          <div className="bg-orb bg-orb-3" aria-hidden="true" />
          <div className="home-hero">
            <h1 className="home-banner">
              Welcome to <span style={{ background: 'linear-gradient(135deg, #00d4ff, #8a2be2, #ff007f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pulseroom</span>
            </h1>
            <p className="home-subtitle">
              Connect your Spotify to create shared listening rooms and enjoy music together in real-time.
            </p>
            <div className="home-container">
              <div className="pulseroom-notice-card">
                <h2 className="pulseroom-notice-title">Spotify Required</h2>
                <p className="pulseroom-notice-text">
                  You need to connect your Spotify account to use Pulseroom. Click below to get started.
                </p>
                <a href={`${apiURL}/api/spotify/login`} className="home-action-btn" style={{background: '#1db954', color: '#fff', boxShadow: '0 6px 18px rgba(29, 185, 84, 0.3)'}}>
                  Connect with Spotify
                </a>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (authError) {
    return (
      <>
        <Navbar />
        <div className="home-page">
          <div className="bg-orb bg-orb-1" aria-hidden="true" />
          <div className="bg-orb bg-orb-2" aria-hidden="true" />
          <div className="bg-orb bg-orb-3" aria-hidden="true" />
          <div className="home-hero">
            <div className="pulseroom-notice-card">
              <h2 className="pulseroom-notice-title">Connection failed</h2>
              <p className="pulseroom-notice-text">{authError}</p>
              <a href="/" className="home-action-btn" style={{background: 'rgba(255,255,255,0.1)', color: '#fff'}}>
                Back to home
              </a>
            </div>
          </div>
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
            {accountUser ? `Signed in as ${accountUser.name} ┬╖ ` : ''}
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
                  <span className="home-room-card-arrow">ΓåÆ</span>
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
