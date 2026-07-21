import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, AudioLines, Eye, EyeOff, Menu, X } from 'lucide-react';

import { apiURL } from '../../App.config';
import { useAuth } from '../../hooks/AuthContext';
import './style.css';

const SPOTIFY_LOGIN_URL = `${apiURL}/api/spotify/login`;
const GOOGLE_LOGIN_URL = `${apiURL}/api/auth/google/login`;

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' }
];

function Login() {
  const { user: accountUser, login, register, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountMode, setAccountMode] = useState('login');
  const [accountError, setAccountError] = useState('');
  const [accountBusy, setAccountBusy] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const howItWorksTrigger = useRef(null);

  useEffect(() => {
    const closeOnEscape = event => {
      if (event.key !== 'Escape') return;
      setMobileMenuOpen(false);
      setHowItWorksOpen(false);
      setAccountOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = mobileMenuOpen || howItWorksOpen || accountOpen ? 'hidden' : '';
    return () => { document.removeEventListener('keydown', closeOnEscape); document.body.style.overflow = ''; };
  }, [mobileMenuOpen, howItWorksOpen, accountOpen]);

  const openHowItWorks = () => { setMobileMenuOpen(false); setHowItWorksOpen(true); };
  const closeHowItWorks = () => { setHowItWorksOpen(false); window.requestAnimationFrame(() => howItWorksTrigger.current?.focus()); };
  const openAccount = mode => { setMobileMenuOpen(false); setAccountMode(mode); setAccountError(''); setAccountOpen(true); };
  const submitAccount = async event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = form.get('name');
    const email = form.get('email');
    const password = form.get('password');

    if (accountMode === 'register' && (!name || name.trim().length < 2)) {
      setAccountError('Name must be at least 2 characters.');
      return;
    }
    if (!email || !email.includes('@')) {
      setAccountError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 8) {
      setAccountError('Password must be at least 8 characters.');
      return;
    }

    setAccountBusy(true); setAccountError('');
    try {
      const action = accountMode === 'register' ? register : login;
      await action({ name: name.trim(), email: email.trim(), password });
      setAccountOpen(false);
    } catch (error) {
      setAccountError(error.response?.data?.message || 'Could not access your account.');
    } finally { setAccountBusy(false); }
  };

  return (
    <main className='landing-page'>
      <div className='landing-media' aria-hidden='true'>
        <video className={`landing-video ${videoReady ? 'is-ready' : ''}`} src='https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_204221_5339e40b-e73d-4ab0-9c65-79c18c66fd50.mp4' autoPlay muted loop playsInline onCanPlay={() => setVideoReady(true)} />
        <div className='landing-fallback' /><div className='landing-overlay' /><div className='landing-vignette' />
      </div>
      <nav className='landing-nav' aria-label='Main navigation'>
        <a id='pulseroom-logo' href='/' className='landing-brand'><span className='landing-brand-mark'><AudioLines size={19} /></span><span>Pulseroom</span></a>
        <div className='landing-nav-links'>{navLinks.map(link => <a id={`desktop-${link.label.toLowerCase().replaceAll(' ', '-')}`} key={link.label} href={link.href}>{link.label}</a>)}</div>
        <div className='landing-nav-actions'>{accountUser ? <button id='account-sign-out' type='button' className='account-nav-button' onClick={logout}>Hi, {accountUser.name} · Sign out</button> : <button id='open-account-login' type='button' className='account-nav-button' onClick={() => openAccount('login')}>Login</button>}</div>
        <button id='mobile-menu-toggle' type='button' className='mobile-menu-toggle' aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileMenuOpen} aria-controls='mobile-navigation' onClick={() => setMobileMenuOpen(open => !open)}>{mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </nav>
      <aside id='mobile-navigation' className={`mobile-navigation ${mobileMenuOpen ? 'is-open' : ''}`} aria-hidden={!mobileMenuOpen}><div className='mobile-nav-inner'><p>Navigate</p>{navLinks.map(link => <a key={link.label} href={link.href} onClick={() => setMobileMenuOpen(false)} tabIndex={mobileMenuOpen ? 0 : -1}>{link.label}</a>)}{accountUser ? <button id='mobile-account-sign-out' type='button' className='mobile-account-action' onClick={logout} tabIndex={mobileMenuOpen ? 0 : -1}>Sign out · {accountUser.name}</button> : <button id='mobile-open-account' type='button' className='mobile-account-action' onClick={() => openAccount('login')} tabIndex={mobileMenuOpen ? 0 : -1}>Sign in</button>}</div></aside>
      <section className='landing-hero' aria-labelledby='landing-heading'><div className='landing-copy'><h1 id='landing-heading'>Hear the same moment.</h1><p className='landing-intro'>Connect your Spotify or Google account, create a room, and shape one shared queue with friends in real time.</p><div className='landing-actions'><button ref={howItWorksTrigger} id='how-it-works-trigger' type='button' className='landing-secondary' onClick={openHowItWorks}>How it works</button></div></div></section>
      {accountOpen && (
        <div className='account-modal-backdrop' onMouseDown={event => { if (event.target === event.currentTarget) setAccountOpen(false); }}>
          <section className='account-modal' role='dialog' aria-modal='true' aria-labelledby='account-modal-title'>
            <button id='close-account-modal' type='button' className='account-modal-close' onClick={() => setAccountOpen(false)} aria-label='Close login dialog'><X size={20} /></button>
            <h2 id='account-modal-title'>Sign in to Pulseroom</h2>
            <p className='account-description'>Connect your account to start creating and sharing music rooms.</p>

            <div className='account-oauth-buttons'>
              <a id='modal-connect-spotify' href={SPOTIFY_LOGIN_URL} className='account-oauth-btn account-oauth-spotify'>
                <svg width='18' height='18' viewBox='0 0 24 24' fill='currentColor'><path d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.479.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z'/></svg>
                Continue with Spotify
              </a>
              <a id='modal-connect-google' href={GOOGLE_LOGIN_URL} className='account-oauth-btn account-oauth-google'>
                <svg width='18' height='18' viewBox='0 0 24 24'><path fill='#fff' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z'/><path fill='#fff' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/><path fill='#fff' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/><path fill='#fff' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/></svg>
                Continue with Google
              </a>
            </div>

            <div className='account-divider'><span>or sign in with email</span></div>

            <form onSubmit={submitAccount}>
              {accountMode === 'register' && (
                <label>Name<input id='account-name' name='name' type='text' autoComplete='name' maxLength='60' autoFocus required /></label>
              )}
              <label>Email<input id='account-email' name='email' type='email' autoComplete='email' autoFocus={accountMode === 'login'} required /></label>
              <label>Password
                <div className='password-input-wrapper'>
                  <input id='account-password' name='password' type={showPassword ? 'text' : 'password'} autoComplete={accountMode === 'register' ? 'new-password' : 'current-password'} minLength='8' required />
                  <button type='button' className='password-toggle' onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </label>
              {accountError && <p className='account-error' role='alert'>{accountError}</p>}
              <button id='submit-account-form' type='submit' disabled={accountBusy} aria-busy={accountBusy}>
                {accountBusy ? 'Please wait…' : accountMode === 'register' ? 'Create account' : 'Sign in'}
              </button>
            </form>
            <button id='switch-account-mode' type='button' className='account-mode-switch' disabled={accountBusy} onClick={() => { setAccountMode(mode => mode === 'login' ? 'register' : 'login'); setAccountError(''); }}>
              {accountMode === 'login' ? 'New here? Create an account' : 'Already registered? Sign in'}
            </button>
          </section>
        </div>
      )}
      {howItWorksOpen && <div className='how-modal-backdrop' onMouseDown={event => { if (event.target === event.currentTarget) closeHowItWorks(); }}><section className='how-modal' role='dialog' aria-modal='true' aria-labelledby='how-modal-title'><header className='how-modal-header'><div><p>Spotify Premium · Real-time rooms</p><h2 id='how-modal-title'>One room. One invite. One shared pulse.</h2></div><button id='close-how-it-works' type='button' onClick={closeHowItWorks} aria-label='Close how it works'><X size={21} /></button></header><div className='how-modal-body'><div className='how-modal-copy'><p>Every listener connects their own Spotify Premium playback device while Pulseroom synchronizes the queue and controls between room members.</p><div className='how-modal-actions'><a id='modal-read-more' href='/about'>Read more</a></div></div></div></section></div>}
      <footer className='landing-proof-strip'><span>Spotify Premium</span><span>Real-time sockets</span><span>Shared queue</span><span>Private OAuth session</span></footer>
    </main>
  );
}

export default Login;
