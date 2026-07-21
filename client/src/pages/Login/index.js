import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, AudioLines, Eye, EyeOff, Menu, X } from 'lucide-react';

import { apiURL } from '../../App.config';
import { useAuth } from '../../hooks/AuthContext';
import './style.css';

const SPOTIFY_LOGIN_URL = `${apiURL}/api/spotify/login`;
const GOOGLE_LOGIN_URL = `${apiURL}/api/auth/google/login`;

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Continue with Google', href: GOOGLE_LOGIN_URL },
  { label: 'Sign in with Spotify', href: SPOTIFY_LOGIN_URL },
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

    // Client-side validation
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
        <div className='landing-nav-actions'>{accountUser ? <button id='account-sign-out' type='button' className='account-nav-button' onClick={logout}>Hi, {accountUser.name} · Sign out</button> : <button id='open-account-login' type='button' className='account-nav-button' onClick={() => openAccount('login')}>Account</button>}<a id='desktop-spotify-login' href={SPOTIFY_LOGIN_URL} className='landing-nav-cta'>Connect Spotify <ArrowRight size={16} /></a></div>
        <button id='mobile-menu-toggle' type='button' className='mobile-menu-toggle' aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileMenuOpen} aria-controls='mobile-navigation' onClick={() => setMobileMenuOpen(open => !open)}>{mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </nav>
      <aside id='mobile-navigation' className={`mobile-navigation ${mobileMenuOpen ? 'is-open' : ''}`} aria-hidden={!mobileMenuOpen}><div className='mobile-nav-inner'><p>Navigate</p>{navLinks.map(link => <a key={link.label} href={link.href} onClick={() => setMobileMenuOpen(false)} tabIndex={mobileMenuOpen ? 0 : -1}>{link.label}</a>)}{accountUser ? <button id='mobile-account-sign-out' type='button' className='mobile-account-action' onClick={logout} tabIndex={mobileMenuOpen ? 0 : -1}>Sign out · {accountUser.name}</button> : <button id='mobile-open-account' type='button' className='mobile-account-action' onClick={() => openAccount('login')} tabIndex={mobileMenuOpen ? 0 : -1}>PulseRoom account</button>}</div></aside>
      <section className='landing-hero' aria-labelledby='landing-heading'><div className='landing-copy'><h1 id='landing-heading'>Hear the same moment.</h1><p className='landing-intro'>Connect your Spotify or Google account, create a room, and shape one shared queue with friends in real time.</p><div className='landing-actions'><a id='connect-spotify' href={SPOTIFY_LOGIN_URL} className='landing-primary'>Connect Spotify <ArrowRight size={18} /></a><a id='connect-google' href={GOOGLE_LOGIN_URL} className='landing-google'>Continue with Google</a><button ref={howItWorksTrigger} id='how-it-works-trigger' type='button' className='landing-secondary' onClick={openHowItWorks}>How it works</button></div></div></section>
      {accountOpen && <div className='account-modal-backdrop' onMouseDown={event => { if (event.target === event.currentTarget) setAccountOpen(false); }}><section className='account-modal' role='dialog' aria-modal='true' aria-labelledby='account-modal-title' aria-describedby='account-modal-description'><button id='close-account-modal' type='button' className='account-modal-close' onClick={() => setAccountOpen(false)} aria-label='Close account dialog'><X size={20} /></button><p className='account-eyebrow'>PulseRoom identity</p><h2 id='account-modal-title'>{accountMode === 'register' ? 'Create your account' : 'Welcome back'}</h2><p id='account-modal-description' className='account-description'>Your PulseRoom account powers persistent profiles and upcoming messaging. Spotify remains connected separately for playback.</p><form onSubmit={submitAccount}>{accountMode === 'register' && <label>Name<input id='account-name' name='name' type='text' autoComplete='name' maxLength='60' autoFocus required /></label>}<label>Email<input id='account-email' name='email' type='email' autoComplete='email' autoFocus={accountMode === 'login'} required /></label><label>Password<div className='password-input-wrapper'><input id='account-password' name='password' type={showPassword ? 'text' : 'password'} autoComplete={accountMode === 'register' ? 'new-password' : 'current-password'} minLength='8' required /><button type='button' className='password-toggle' onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>{accountError && <p className='account-error' role='alert'>{accountError}</p>}<button id='submit-account-form' type='submit' disabled={accountBusy} aria-busy={accountBusy}>{accountBusy ? 'Please wait…' : accountMode === 'register' ? 'Create account' : 'Sign in'}</button></form><button id='switch-account-mode' type='button' className='account-mode-switch' disabled={accountBusy} onClick={() => { setAccountMode(mode => mode === 'login' ? 'register' : 'login'); setAccountError(''); }}>{accountMode === 'login' ? 'New here? Create an account' : 'Already registered? Sign in'}</button></section></div>}
      {howItWorksOpen && <div className='how-modal-backdrop' onMouseDown={event => { if (event.target === event.currentTarget) closeHowItWorks(); }}><section className='how-modal' role='dialog' aria-modal='true' aria-labelledby='how-modal-title'><header className='how-modal-header'><div><p>Spotify Premium · Real-time rooms</p><h2 id='how-modal-title'>One room. One invite. One shared pulse.</h2></div><button id='close-how-it-works' type='button' onClick={closeHowItWorks} aria-label='Close how it works'><X size={21} /></button></header><div className='how-modal-body'><div className='how-modal-copy'><p>Every listener connects their own Spotify Premium playback device while Pulseroom synchronizes the queue and controls between room members.</p><div className='how-modal-actions'><a id='modal-connect-spotify' href={SPOTIFY_LOGIN_URL}>Connect Spotify <ArrowRight size={17} /></a><a id='modal-read-more' href='/about'>Read more</a></div></div></div></section></div>}
      <footer className='landing-proof-strip'><span>Spotify Premium</span><span>Real-time sockets</span><span>Shared queue</span><span>Private OAuth session</span></footer>
    </main>
  );
}

export default Login;

