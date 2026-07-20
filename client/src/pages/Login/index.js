import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, AudioLines, Menu, X } from 'lucide-react';

import './style.css';

const SPOTIFY_LOGIN_URL = process.env.NODE_ENV === 'production'
  ? '/api/spotify/login'
  : 'http://127.0.0.1:8888/api/spotify/login';


const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Sign in with Spotify', href: SPOTIFY_LOGIN_URL },
  { label: 'About', href: '/about' }
];

function Login() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const howItWorksTrigger = useRef(null);

  useEffect(() => {
    const closeOnEscape = event => {
      if (event.key !== 'Escape') return;
      setMobileMenuOpen(false);
      setHowItWorksOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = mobileMenuOpen || howItWorksOpen ? 'hidden' : '';
    return () => { document.removeEventListener('keydown', closeOnEscape); document.body.style.overflow = ''; };
  }, [mobileMenuOpen, howItWorksOpen]);

  const openHowItWorks = () => { setMobileMenuOpen(false); setHowItWorksOpen(true); };
  const closeHowItWorks = () => { setHowItWorksOpen(false); window.requestAnimationFrame(() => howItWorksTrigger.current?.focus()); };

  return (
    <main className='landing-page'>
      <div className='landing-media' aria-hidden='true'>
        <video className={`landing-video ${videoReady ? 'is-ready' : ''}`} src='https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_204221_5339e40b-e73d-4ab0-9c65-79c18c66fd50.mp4' autoPlay muted loop playsInline onCanPlay={() => setVideoReady(true)} />
        <div className='landing-fallback' /><div className='landing-overlay' /><div className='landing-vignette' />
      </div>
      <nav className='landing-nav' aria-label='Main navigation'>
        <a id='pulseroom-logo' href='/' className='landing-brand'><span className='landing-brand-mark'><AudioLines size={19} /></span><span>Pulseroom</span></a>
        <div className='landing-nav-links'>{navLinks.map(link => <a id={`desktop-${link.label.toLowerCase().replaceAll(' ', '-')}`} key={link.label} href={link.href}>{link.label}</a>)}</div>
        <div className='landing-nav-actions'><a id='desktop-spotify-login' href={SPOTIFY_LOGIN_URL} className='landing-nav-cta'>Connect Spotify <ArrowRight size={16} /></a></div>
        <button id='mobile-menu-toggle' type='button' className='mobile-menu-toggle' aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileMenuOpen} aria-controls='mobile-navigation' onClick={() => setMobileMenuOpen(open => !open)}>{mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </nav>
      <aside id='mobile-navigation' className={`mobile-navigation ${mobileMenuOpen ? 'is-open' : ''}`} aria-hidden={!mobileMenuOpen}><div className='mobile-nav-inner'><p>Navigate</p>{navLinks.map(link => <a key={link.label} href={link.href} onClick={() => setMobileMenuOpen(false)} tabIndex={mobileMenuOpen ? 0 : -1}>{link.label}</a>)}</div></aside>
      <section className='landing-hero' aria-labelledby='landing-heading'><div className='landing-copy'><h1 id='landing-heading'>Hear the same moment.</h1><p className='landing-intro'>Connect your Spotify Premium account, create a room, and shape one shared queue with friends in real time.</p><div className='landing-actions'><a id='connect-spotify' href={SPOTIFY_LOGIN_URL} className='landing-primary'>Connect Spotify <ArrowRight size={18} /></a><button ref={howItWorksTrigger} id='how-it-works-trigger' type='button' className='landing-secondary' onClick={openHowItWorks}>How it works</button></div></div></section>
      {howItWorksOpen && <div className='how-modal-backdrop' onMouseDown={event => { if (event.target === event.currentTarget) closeHowItWorks(); }}><section className='how-modal' role='dialog' aria-modal='true' aria-labelledby='how-modal-title'><header className='how-modal-header'><div><p>Spotify Premium · Real-time rooms</p><h2 id='how-modal-title'>One room. One invite. One shared pulse.</h2></div><button id='close-how-it-works' type='button' onClick={closeHowItWorks} aria-label='Close how it works'><X size={21} /></button></header><div className='how-modal-body'><div className='how-modal-copy'><p>Every listener connects their own Spotify Premium playback device while Pulseroom synchronizes the queue and controls between room members.</p><div className='how-modal-actions'><a id='modal-connect-spotify' href={SPOTIFY_LOGIN_URL}>Connect Spotify <ArrowRight size={17} /></a><a id='modal-read-more' href='/about'>Read more</a></div></div></div></section></div>}
      <footer className='landing-proof-strip'><span>Spotify Premium</span><span>Real-time sockets</span><span>Shared queue</span><span>Private OAuth session</span></footer>
    </main>
  );
}

export default Login;

