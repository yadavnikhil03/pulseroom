import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, AudioLines, DatabaseZap, Radio, Users } from 'lucide-react';

import Navbar from '../../components/Navbar';

import './style.css';

const DEMO_URL = '/home?access_token=dev_mock_token';

const steps = [
  {
    number: '01',
    title: 'Create a room',
    text: 'Pick a local collection and Pulseroom creates a temporary shared session in memory.',
    icon: Radio
  },
  {
    number: '02',
    title: 'Share one link',
    text: 'Open the room in another browser tab to add a second independent listener.',
    icon: Users
  },
  {
    number: '03',
    title: 'Stay synchronized',
    text: 'Playback, queue changes, likes, and listener presence update through Socket.io.',
    icon: AudioLines
  }
];

function About() {
  return (
    <main className='about-page'>
      <Navbar />
      <div className='about-ambient' aria-hidden='true' />

      <section className='about-hero' aria-labelledby='about-heading'>
        <Link id='about-back-home' to='/' className='about-back'><ArrowLeft size={16} /> Back home</Link>
        <div className='about-hero-grid'>
          <div>
            <p className='about-kicker'>The story behind Pulseroom</p>
            <h1 id='about-heading'>One room.<br />One queue.<br /><span>One pulse.</span></h1>
          </div>
          <div className='about-introduction'>
            <p>Pulseroom is a collaborative listening experience designed to make shared playback feel immediate and effortless.</p>
            <p>This Local Demo edition recreates the complete room experience without Spotify Premium: generated audio, an in-memory queue, and real-time browser synchronization.</p>
            <Link id='about-primary-demo' to={DEMO_URL}>Experience the Local Demo <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>

      <section className='about-process' aria-labelledby='process-heading'>
        <div className='about-section-heading'>
          <p className='about-kicker'>How the demonstration works</p>
          <h2 id='process-heading'>From lobby to live room in three steps.</h2>
        </div>
        <div className='about-step-grid'>
          {steps.map(step => {
            const Icon = step.icon;
            return (
              <article className='about-step' key={step.number}>
                <div className='about-step-top'><span>{step.number}</span><Icon size={21} /></div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className='about-build' aria-label='Technology and project details'>
        <div className='about-build-icon'><DatabaseZap size={27} /></div>
        <div>
          <p className='about-kicker'>Built for a reliable local presentation</p>
          <h2>React · Node.js · Express · Socket.io · Web Audio</h2>
          <p>Rooms live in server memory and reset when the server restarts. No paid account, external database, or copyrighted audio files are needed.</p>
        </div>
        <div className='about-author'>
          <small>Designed &amp; developed by</small>
          <strong>Nikhil Yadav</strong>
          <span>@yadavnikhil03</span>
        </div>
      </section>

      <footer className='about-footer'>
        <span>© 2026 Pulseroom</span>
        <span>Local listening, shared beautifully.</span>
      </footer>
    </main>
  );
}

export default About;
