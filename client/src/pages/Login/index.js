import React from 'react';
import { Link } from 'react-router-dom';

import { apiURL } from '../../App.config';
import './style.css';

function Login() {
  return (
    <div className='login-page'>
      {}
      <div className='bg-orb bg-orb-1'></div>
      <div className='bg-orb bg-orb-2'></div>
      <div className='bg-orb bg-orb-3'></div>

      {}
      <section className='hero-section'>

        {}
        <div className='hero-left'>
          <h1 className='brand-wordmark'>Pulseroom</h1>
          <p className='brand-tagline'>Listen together. In real&#8209;time.</p>
          <p className='brand-description'>
            Create synchronized listening rooms where friends enjoy music
            together — vote on the next track, chat live, and experience
            perfectly synced playback across every device.
          </p>

          {}
          <div className='btn-group'>
            <button
              className='spotify-btn'
              onClick={() => {
                window.location = `${apiURL}/api/spotify/login`;
              }}
            >
              <svg className='spotify-icon' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z' />
              </svg>
              Continue with Spotify
            </button>

            <Link to='/about' className='learn-more-btn'>
              Learn more
              <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                <path d='M5 12h14' /><path d='M12 5l7 7-7 7' />
              </svg>
            </Link>
          </div>

          {}
          <div style={{ marginBottom: '32px' }}>
            <button
              className='dev-mode-btn'
              onClick={() => {
                window.location.href = '/home?access_token=dev_mock_token';
              }}
            >
              <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                <polyline points='16 18 22 12 16 6' /><polyline points='8 6 2 12 8 18' />
              </svg>
              Dev Mode
            </button>
          </div>

          {}
          <div className='trust-row'>
            <span className='trust-item'>
              <span className='trust-check'>✓</span> No installation
            </span>
            <span className='trust-item'>
              <span className='trust-check'>✓</span> Spotify Secure Login
            </span>
            <span className='trust-item'>
              <span className='trust-check'>✓</span> Free to start
            </span>
          </div>
        </div>

        {}
        <div className='hero-right'>
          <div className='showcase-container'>

            {}
            <div className='player-card'>

              {}
              <div className='card-room-header'>
                <div className='room-label'>
                  <div className='room-dot'></div>
                  <span className='room-name'>Evening Chill</span>
                </div>
                <span className='room-listeners'>4 listening</span>
              </div>

              {}
              <div className='card-track'>
                <div className='track-art'>
                  <svg className='track-art-icon' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'>
                    <path d='M9 18V5l12-2v13' />
                    <circle cx='6' cy='18' r='3' /><circle cx='18' cy='16' r='3' />
                  </svg>
                </div>
                <div className='track-info'>
                  <p className='track-title'>Midnight City</p>
                  <p className='track-artist'>M83</p>
                </div>
              </div>

              {}
              <div className='card-eq'>
                <div className='eq-bar'></div>
                <div className='eq-bar'></div>
                <div className='eq-bar'></div>
                <div className='eq-bar'></div>
                <div className='eq-bar'></div>
                <div className='eq-bar'></div>
                <div className='eq-bar'></div>
                <div className='eq-bar'></div>
              </div>

              {}
              <div className='card-progress'>
                <div className='progress-bar-bg'>
                  <div className='progress-bar-fill'></div>
                </div>
                <div className='progress-times'>
                  <span className='progress-time'>1:24</span>
                  <span className='progress-time'>3:42</span>
                </div>
              </div>

              {}
              <div className='card-listeners'>
                <div className='avatar-stack'>
                  <div className='avatar avatar-1'>N</div>
                  <div className='avatar avatar-2'>A</div>
                  <div className='avatar avatar-3'>R</div>
                  <div className='avatar avatar-4'>+2</div>
                </div>
                <span className='listeners-text'>Synced & listening together</span>
              </div>
            </div>

            {}
            <div className='queue-card'>
              <p className='queue-title'>Up Next</p>
              <div className='queue-item'>
                <div className='queue-dot q-dot-1'></div>
                <div className='queue-item-info'>
                  <p className='queue-item-title'>Blinding Lights</p>
                  <p className='queue-item-artist'>The Weeknd</p>
                </div>
              </div>
              <div className='queue-item'>
                <div className='queue-dot q-dot-2'></div>
                <div className='queue-item-info'>
                  <p className='queue-item-title'>Starboy</p>
                  <p className='queue-item-artist'>The Weeknd</p>
                </div>
              </div>
              <div className='queue-item'>
                <div className='queue-dot q-dot-3'></div>
                <div className='queue-item-info'>
                  <p className='queue-item-title'>Levitating</p>
                  <p className='queue-item-artist'>Dua Lipa</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </section>

      {}
      <footer className='login-footer'>
        <Link to='/about' className='footer-link'>About</Link>
        <span className='footer-dot'>·</span>
        <span className='footer-copy'>© 2026 Pulseroom</span>
      </footer>
    </div>
  );
}

export default Login;
