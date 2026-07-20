import React, { useState, useEffect } from 'react';
import queryString from 'query-string';
import hexGen from 'hex-generator';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Image from 'react-bootstrap/Image';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import Carousel from 'react-bootstrap/Carousel';

import Playlist from '../../components/Playlist';
import RoomButtons from '../../components/RoomButtons';

import './style.css';

import DevDashboard from './DevDashboard';

import config from './config';
import utils from './utils';
import API from '../../utils/API';
import SpotifyAPI from '../../utils/SpotifyAPI';
import spotifyHelpers from '../../utils/spotifyHelpers';
import globalUtils from '../../utils/globalUtils';

const Home = () => {
  const [user, setUser] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [spotifyAlert, setSpotifyAlert] = useState(false);
  const [playlistAlert, setPlaylistAlert] = useState(false);
  const [joinAlert, setJoinAlert] = useState(false);
  const [spinnerDisplay, setSpinnerDisplay] = useState(false);
  const [slides, setSlides] = useState(null);
  const [centerAlert, setCenterAlert] = useState(config.centerAlert.clear);
  const [authError, setAuthError] = useState(null);
  const [isMinLoading, setIsMinLoading] = useState(true);
  const parsedURL = queryString.parse(window.location.search);
  const token = parsedURL.access_token;

  const handleUser = async () => {
    if (parsedURL.error || !token || token === 'undefined') {
      setAuthError(parsedURL.error || 'Invalid or missing access token');
      return;
    }
    if (token === 'dev_mock_token') {
      setUser({ name: 'Demo Listener', id: 'demo', image: '/images/icons/pulseroom-logo.svg' });
      return;
    }
    const currentUser = await spotifyHelpers.user(token);
    if (currentUser && currentUser.id) {
      setUser(currentUser);
    } else if (currentUser && currentUser.error) {
      setAuthError(`${currentUser.message}`);
    } else {
      setAuthError("Failed to fetch Spotify profile. Your token may have expired, or your Spotify account email is not added to the 'Users and Access' list in the Spotify Developer Dashboard (while app is in Development mode).");
    }
  };

  const handlePlaylists = async token => {
    const playlists = await utils.getPlaylists(token);
if (playlists) {
  setSlides(globalUtils.configureSlides(playlists, 8));
}

    if (playlists[0]) {
      
      setSlides(globalUtils.configureSlides(playlists, 8));
    }
  };

  const verifyTrackPlaying = async token => {
    if (token === 'dev_mock_token') {
      setSpotifyAlert(false);
      return;
    }
    const isCurrentlyPlaying = await utils.verifySpotifyActive(token);

    !isCurrentlyPlaying ? setSpotifyAlert(true) : setSpotifyAlert(false);
  };

  const handlePlaylistClick = e => {
    setPlaylistAlert(true);
    setSelectedPlaylist(e.target.id);
  };

  const createPlaylistRoom = async () => {
    try {
      const roomHex = hexGen(16);
      const { data } = await SpotifyAPI.getPlaylistTracks(token, selectedPlaylist);

      await API.createRoom(roomHex);

      for await (const trackObj of data.items) {
        let trackInfo = `${trackObj.track.name} - ${trackObj.track.artists[0].name}`;

        await API.addTrack(roomHex, trackObj.track.id, trackInfo);
        await SpotifyAPI.addTrackToQueue(token, trackObj.track.id);
      }

      return roomHex;
    } catch (err) {
      console.log('Error:', err);
    }
  };

  const playlistRoomHandler = async () => {
    setPlaylistAlert(false);
    renderCenterAlert(config.centerAlert.playlistRoom);
    
    await createPlaylistRoom().then(roomHex => {
      renderCenterAlert(config.centerAlert.clear);
      globalUtils.addRoomToURL(window.location.href, token, roomHex);
    });
  };

  const renderCenterAlert = errorObj => {
    setCenterAlert(errorObj);

    if (errorObj.disappear) {
      setTimeout(() => setCenterAlert(config.centerAlert.clear), 3000);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMinLoading(false);
    }, 650);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (parsedURL.error || token === 'undefined') {
      setAuthError(parsedURL.error || 'Invalid Spotify token');
      return;
    }
    if (token && !user && !authError) {
      if (spinnerDisplay) setSpinnerDisplay(false);
      handleUser();
      if (token !== 'dev_mock_token') {
        handlePlaylists(token);
        verifyTrackPlaying(token);
      }
    }
  }, [token, user, authError]);

  if (!token || token === 'undefined') {
    window.location.replace('/');
    return null;
  }

  if (isMinLoading || (!user && !authError && !parsedURL.error)) {
    return (
      <div className='home-page d-flex flex-column align-items-center justify-content-center text-center' style={{ minHeight: '100vh', padding: '40px 20px', background: '#050505', fontFamily: "'Montserrat', -apple-system, sans-serif", position: 'relative', overflow: 'hidden' }}>
        {}
        <div className='bg-orb bg-orb-1'></div>
        <div className='bg-orb bg-orb-2'></div>
        <div className='bg-orb bg-orb-3'></div>

        <div className='fadeUp' style={{ maxWidth: '460px', width: '100%', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          {}
          <div className='pulseroom-loader-container'>
            <div className='pulseroom-bar'></div>
            <div className='pulseroom-bar'></div>
            <div className='pulseroom-bar'></div>
            <div className='pulseroom-bar'></div>
            <div className='pulseroom-bar'></div>
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#ffffff', margin: '16px 0 10px', letterSpacing: '-0.5px' }}>
            Preparing your Local Demo…
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#888888', lineHeight: '1.6', margin: '0 auto', maxWidth: '380px' }}>
            Connecting to the local room engine and loading the demo catalogue.
          </p>
        </div>
      </div>
    );
  }

  if (authError || parsedURL.error) {
    return (
      <div className='home-page d-flex flex-column align-items-center justify-content-center text-center' style={{ minHeight: '100vh', padding: '30px 20px', background: '#050505', fontFamily: "'Montserrat', -apple-system, sans-serif" }}>
        <div className='fadeUp' style={{ maxWidth: '580px', width: '100%', margin: '0 auto' }}>
          
          {}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', height: '220px' }}>
            <span style={{ fontSize: 'clamp(6rem, 16vw, 8.5rem)', fontWeight: '800', color: '#ffffff', letterSpacing: '-5px', lineHeight: 1, userSelect: 'none' }}>
              4
            </span>

            {}
            <div style={{ position: 'relative', width: '150px', height: '200px', margin: '0 -5px' }}>
              <svg viewBox='0 0 200 240' fill='none' xmlns='http://www.w3.org/2000/svg' style={{ width: '100%', height: '100%' }}>
                {}
                <circle cx='100' cy='85' r='48' stroke='#ffffff' strokeWidth='16' fill='#050505' />
                
                {}
                <path d='M75 65 L65 42 L88 56 C95 53 105 53 112 56 L135 42 L125 65 C136 76 136 96 120 106 C106 114 94 114 80 106 C64 96 64 76 75 65 Z' fill='#1e2229' stroke='#ffffff' strokeWidth='4' strokeLinejoin='round' />
                
                {}
                <path d='M70 48 L76 62 M130 48 L124 62' stroke='#a0a0a0' strokeWidth='3' strokeLinecap='round' />
                
                {}
                <path d='M82 82 Q88 78 92 82' stroke='#ffffff' strokeWidth='3.5' strokeLinecap='round' />
                <path d='M108 82 Q112 78 118 82' stroke='#ffffff' strokeWidth='3.5' strokeLinecap='round' />
                <path d='M97 92 L103 92 L100 95 Z' fill='#ffffff' />
                <path d='M95 98 Q100 103 105 98' stroke='#ffffff' strokeWidth='2.5' strokeLinecap='round' />
                
                {}
                <path d='M65 85 L52 82 M65 92 L52 95 M135 85 L148 82 M135 92 L148 95' stroke='#a0a0a0' strokeWidth='2' strokeLinecap='round' />
                
                {}
                <path d='M82 130 C82 165 118 165 118 130' fill='#1e2229' stroke='#ffffff' strokeWidth='4' />
                {}
                <path d='M68 95 C62 95 62 120 72 120 C82 120 82 105 76 98' fill='#1e2229' stroke='#ffffff' strokeWidth='4' />
                {}
                <path d='M132 95 C138 95 138 120 128 120 C118 120 118 105 124 98' fill='#1e2229' stroke='#ffffff' strokeWidth='4' />
                {}
                <ellipse cx='86' cy='158' rx='10' ry='7' fill='#1e2229' stroke='#ffffff' strokeWidth='3' transform='rotate(-20 86 158)' />
                <ellipse cx='118' cy='148' rx='10' ry='7' fill='#1e2229' stroke='#ffffff' strokeWidth='3' transform='rotate(25 118 148)' />
                
                {}
                <path d='M90 162 Q70 195 60 175 Q52 155 72 145' fill='none' stroke='#ffffff' strokeWidth='8' strokeLinecap='round' />
                <path d='M67 182 L62 176 M72 168 L67 160' stroke='#1e2229' strokeWidth='3' strokeLinecap='round' />
                
                {}
                <circle cx='115' cy='205' r='18' fill='#1e2229' stroke='#ffffff' strokeWidth='3' />
                <path d='M103 200 C110 195 120 215 128 208 M105 212 C115 208 118 195 125 198 M112 188 C112 215 115 218 114 222' stroke='#ffffff' strokeWidth='2' />
                <path d='M65 222 Q90 226 102 218 M128 215 Q145 225 165 222' fill='none' stroke='#ffffff' strokeWidth='2' strokeLinecap='round' />
                <ellipse cx='118' cy='224' rx='14' ry='3' fill='#222222' />
                
                {}
                <path d='M155 210 L168 210 L165 222 L158 222 Z' fill='#1e2229' stroke='#ffffff' strokeWidth='2.5' />
                <path d='M161 210 Q148 190 152 182 Q162 185 161 210 M162 210 Q175 188 180 192 Q178 202 162 210' fill='#2a2e33' stroke='#ffffff' strokeWidth='2' />
              </svg>
            </div>

            <span style={{ fontSize: 'clamp(6rem, 16vw, 8.5rem)', fontWeight: '800', color: '#ffffff', letterSpacing: '-5px', lineHeight: 1, userSelect: 'none' }}>
              3
            </span>
          </div>

          {}
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#ffffff', margin: '18px 0 10px', letterSpacing: '-0.3px' }}>
            Spotify connection paused
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#999999', maxWidth: '440px', margin: '0 auto 28px', lineHeight: '1.6' }}>
            Spotify requires the app developer to have an active Premium plan for live room features (HTTP 403). We're sorting this out right now—hang tight and check back soon!
          </p>

          {}
          <a
            href='/'
            style={{
              display: 'inline-block',
              background: '#ffffff',
              color: '#050505',
              fontFamily: "'Montserrat', -apple-system, sans-serif",
              fontWeight: '700',
              fontSize: '0.9rem',
              padding: '12px 30px',
              borderRadius: '50px',
              textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(255, 255, 255, 0.15)',
              transition: 'transform 0.2s ease, background 0.2s ease'
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.background = '#f0f0f0'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#ffffff'; }}
          >
            Back to home page
          </a>
        </div>
      </div>
    );
  }

  const safeName = user.name ? user.name.toString() : 'Pulseroom User';
  const safeFirstName = safeName.split(' ')[0] || 'User';
  const safeImage = user.image || '/images/icons/pulseroom-logo.svg';

  if (token === 'dev_mock_token') {
    return (
      <DevDashboard user={user} />
    );
  }

  return (
    <div className='home-page'>
      <div className='bg-orb bg-orb-1'></div>
      <div className='bg-orb bg-orb-2'></div>
      <div className='bg-orb bg-orb-3'></div>

      <nav className='home-navbar'>
        <div className='home-nav-left'>
          <span className='home-logo'>Pulseroom</span>
          <span className='home-status-badge'>● Live Room Network</span>
        </div>
        <div className='home-nav-right'>
          <div className='user-profile-pill'>
            <Image roundedCircle src={safeImage} className='home-avatar' />
            <span className='home-username'>{safeName}</span>
          </div>
        </div>
      </nav>

      <Container className='home-container'>
        <div className='home-hero fadeUp'>
          <h1 className='home-banner'>
            Welcome to <span className='welcome-brand'>Pulseroom</span>,{' '}
            <span className='welcome-username'>{safeFirstName}</span>!
          </h1>
          <p className='home-subtitle'>
            Select a playlist below to start broadcasting, or join a friend's real-time music room.
          </p>

          {spotifyAlert && (
            <div className='spotify-notice-card'>
              <div className='spotify-notice-left'>
                <svg className='spotify-notice-icon' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z'/>
                </svg>
                <div>
                  <h4 className='notice-title'>Spotify Player Idle</h4>
                  <p className='notice-desc'>To queue songs when joining or hosting a room, open Spotify on any device and start playing a track.</p>
                </div>
              </div>
              <button className='notice-action-btn' onClick={() => verifyTrackPlaying(token)}>
                ↻ Check Player Ready
              </button>
            </div>
          )}
        </div>

        {}
        <div className='room-hub-section fadeUp'>
          <RoomButtons
            token={token}
            renderCenterAlert={renderCenterAlert}
            centerAlertConfig={config.centerAlert}
          />
        </div>

        {}
        <div className='alert-overlay-container'>
          {playlistAlert && (
            <div className='glass-modal-card fadeUp'>
              <h4 className='modal-title'>Start Room with Playlist?</h4>
              <p className='modal-desc'>Create a live collaborative room preloaded with your selected Spotify playlist.</p>
              <div className='modal-actions'>
                <button className='modal-cancel-btn' onClick={() => setPlaylistAlert(false)}>Cancel</button>
                <button className='modal-confirm-btn' onClick={() => playlistRoomHandler()}>Launch Room ✦</button>
              </div>
            </div>
          )}

          {centerAlert.show && (
            <div className='glass-modal-card fadeUp'>
              <h4 className='modal-title'>{centerAlert.title}</h4>
              {centerAlert.text && <p className='modal-desc'>{centerAlert.text}</p>}
              {centerAlert.spinner && (
                <div className='spinner-wrapper'>
                  <Spinner animation='border' variant='success' size='lg' />
                </div>
              )}
            </div>
          )}
        </div>

        {}
        <div className='playlists-section fadeUp'>
          <div className='section-header'>
            <h2 className='section-title'>Your Spotify Playlists 🎧</h2>
            <p className='section-subtitle'>Click any playlist cover to instantly launch a live room preloaded with all its tracks.</p>
          </div>

          <Row className='playlist-carousel-row'>
            <Carousel className='home-carousel' controls interval={6000} indicators={false}>
              {slides
                ? slides.map(slide => (
                    <Carousel.Item key={slides.indexOf(slide)}>
                      <Container>
                        <Row>
                          {slide.map(playlist => (
                            <Playlist
                              key={`playlist-${playlist.id}`}
                              playlistId={playlist.id}
                              image={playlist.images[0].url}
                              name={playlist.name}
                              handlePlaylistClick={handlePlaylistClick}
                            />
                          ))}
                        </Row>
                      </Container>
                    </Carousel.Item>
                  ))
                : null}
            </Carousel>
          </Row>
        </div>
      </Container>
    </div>
  );
};

export default Home;
