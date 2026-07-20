import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, AudioLines, Copy, Link2, Menu, Radio, X } from 'lucide-react';

import './style.css';

const VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_204221_5339e40b-e73d-4ab0-9c65-79c18c66fd50.mp4';
const DEMO_URL = '/home?access_token=dev_mock_token';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Local Demo', href: DEMO_URL },
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

    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen, howItWorksOpen]);

  const openHowItWorks = () => {
    setMobileMenuOpen(false);
    setHowItWorksOpen(true);
  };

  const closeHowItWorks = () => {
    setHowItWorksOpen(false);
    window.requestAnimationFrame(() => howItWorksTrigger.current?.focus());
  };

  return (
    <main className='landing-page'>
      <div className='landing-media' aria-hidden='true'>
        <video
          className={`landing-video ${videoReady ? 'is-ready' : ''}`}
          src={VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          onCanPlay={() => setVideoReady(true)}
        />
        <div className='landing-fallback' />
        <div className='landing-overlay' />
        <div className='landing-vignette' />
      </div>

      <nav className='landing-nav' aria-label='Main navigation'>
        <a id='pulseroom-logo' href='/' className='landing-brand'>
          <span className='landing-brand-mark'><AudioLines size={19} /></span>
          <span>Pulseroom</span>
        </a>

        <div className='landing-nav-links'>
          {navLinks.map(link => (
            <a id={`desktop-${link.label.toLowerCase().replace(' ', '-')}`} key={link.label} href={link.href}>{link.label}</a>
          ))}
        </div>

        <div className='landing-nav-actions'>
          <a id='desktop-launch-demo' href={DEMO_URL} className='landing-nav-cta'>
            Launch demo <ArrowRight size={16} />
          </a>
        </div>

        <button
          id='mobile-menu-toggle'
          type='button'
          className='mobile-menu-toggle'
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls='mobile-navigation'
          onClick={() => setMobileMenuOpen(open => !open)}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <aside id='mobile-navigation' className={`mobile-navigation ${mobileMenuOpen ? 'is-open' : ''}`} aria-hidden={!mobileMenuOpen}>
        <div className='mobile-nav-inner'>
          <p>Navigate</p>
          {navLinks.map(link => (
            <a key={link.label} href={link.href} onClick={() => setMobileMenuOpen(false)} tabIndex={mobileMenuOpen ? 0 : -1}>{link.label}</a>
          ))}
          <a id='mobile-launch-demo' href={DEMO_URL} className='mobile-demo-cta' onClick={() => setMobileMenuOpen(false)} tabIndex={mobileMenuOpen ? 0 : -1}>
            Launch Local Demo <ArrowRight size={18} />
          </a>
        </div>
      </aside>

      <section className='landing-hero' aria-labelledby='landing-heading'>
        <div className='landing-copy'>
          <h1 id='landing-heading'>Hear the same moment.</h1>
          <p className='landing-intro'>Create a room, shape one shared queue, and synchronize local playback across browser tabs. No Spotify Premium or database setup required.</p>
          <div className='landing-actions'>
            <a id='explore-pulseroom' href={DEMO_URL} className='landing-primary'>
              Launch Local Demo <ArrowRight size={18} />
            </a>
            <button ref={howItWorksTrigger} id='how-it-works-trigger' type='button' className='landing-secondary' onClick={openHowItWorks}>How it works</button>
          </div>
        </div>

      </section>

      {howItWorksOpen && <div className='how-modal-backdrop' onMouseDown={event => { if (event.target === event.currentTarget) closeHowItWorks(); }}>
        <section className='how-modal' role='dialog' aria-modal='true' aria-labelledby='how-modal-title' aria-describedby='how-modal-description'>
          <header className='how-modal-header'>
            <div><p>Local Demo · No Spotify required</p><h2 id='how-modal-title'>One room. One invite. One shared pulse.</h2></div>
            <button id='close-how-it-works' type='button' onClick={closeHowItWorks} aria-label='Close how it works'><X size={21} /></button>
          </header>
          <div className='how-modal-body'>
            <div className='how-modal-copy'>
              <p id='how-modal-description'>Pulseroom keeps a shared queue and playback state synchronized between every browser tab in the room.</p>
              <ol className='how-steps'>
                <li><span><Radio size={18} /></span><div><strong>Create</strong><p>Choose a sound collection, name the room, and create it. Pulseroom prepares the first three tracks.</p></div></li>
                <li><span><Link2 size={18} /></span><div><strong>Invite</strong><p>Copy one invite link. A listener pastes it in the lobby and enters automatically.</p></div></li>
                <li><span><Copy size={18} /></span><div><strong>Listen together</strong><p>The host controls play, pause, seek, and skip while listeners hear the synchronized local audio.</p></div></li>
              </ol>
              <div className='how-modal-actions'><a id='modal-launch-demo' href={DEMO_URL}>Create a room <ArrowRight size={17} /></a><a id='modal-read-more' href='/about'>Read more</a></div>
            </div>
            <figure className='how-modal-visual'><img src='https://raw.githubusercontent.com/yadavnikhil03/pulseroom/main/readme/pulseroom-app-flow.png' alt='Pulseroom application flow from room creation to synchronized listening' /><figcaption>Original Pulseroom application flow</figcaption></figure>
          </div>
        </section>
      </div>}

      <footer className='landing-proof-strip'>
        <span>Local catalogue</span>
        <span>Real-time sockets</span>
        <span>Generated audio</span>
        <span>Rooms reset on restart</span>
      </footer>
    </main>
  );
}

export default Login;

