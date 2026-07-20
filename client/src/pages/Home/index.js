import React, { useState, useEffect } from 'react';
import queryString from 'query-string';
import { Link } from 'react-router-dom';

import SpotifyDashboard from './DevDashboard';
import spotifyAuth from '../../utils/spotifyAuth';
import SpotifyAPI from '../../utils/SpotifyAPI';
import './style.css';
import './Loading.css';

const Home = () => {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const parsedURL = queryString.parse(window.location.search);

  const bootstrap = async () => {
    try {
      if (parsedURL.error) {
        const errorType = parsedURL.error === 'access_denied'
          ? 'You declined the Spotify connection.'
          : 'An authentication error occurred.';
        return setAuthError(errorType);
      }
      const { data: user } = await SpotifyAPI.getUserData();
      if (!user.id) throw new Error('Could not load Spotify user profile.');
      const profile = { name: user.display_name || user.id, id: user.id, url: user.external_urls?.spotify, image: user.images?.[0]?.url };
      setUser(profile);

      const { data: playlistData } = await SpotifyAPI.getUserPlaylists(50);
      setPlaylists(playlistData?.items || []);

      const { data: playerData } = await SpotifyAPI.getDevices();
      setPlayerReady(Boolean(playerData?.devices?.some(d => d.is_active)));
    } catch (error) {
      if (error.response?.status === 401) return spotifyAuth.logout();
      setAuthError(error.response?.data?.message || error.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user && !authError) bootstrap();
  }, [user, authError]);

  if (isLoading) {
    return (
      <div className='demo-lobby is-loading' aria-label='Loading Spotify dashboard'>
        <div className='demo-lobby-ambient' aria-hidden='true' />
        <div className='pulseroom-loader-container'>
          {[...Array(5)].map((_, i) => <div key={i} className='pulseroom-bar' />)}
        </div>
        <h1 className='loading-text-header'>Connecting to Pulseroom…</h1>
        <p>Authenticating your Spotify session and preparing the lobby.</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className='demo-lobby is-error' aria-live='polite'>
        <div className='demo-lobby-ambient' aria-hidden='true' />
        <div className='auth-error-icon' aria-hidden='true'>
          <svg viewBox='0 0 24 24'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z' /></svg>
        </div>
        <h1>Connection failed</h1>
        <p>{authError}</p>
        <a href='/' className='demo-nav-link'>Back to home page</a>
      </div>
    );
  }

  if (user) { // Simplified condition, we only need the user to show the welcome message
    return (
      <div className="home-container">
        <div className="home-hero">
          <h1 className="home-banner">
            Welcome, <span className="welcome-username">{user.name}</span>
          </h1>
          <p className="home-subtitle">
            Create a listening room, share the link, and enjoy music together.
          </p>
          <Link to="/create" className="notice-action-btn" style={{fontSize: '1.1rem', padding: '14px 32px'}}>
            Start a Room
          </Link>
        </div>
      </div>
    );
  }

  return null;
};

export default Home;
