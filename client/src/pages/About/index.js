import React from 'react';
import { Link } from 'react-router-dom';

import './style.css';

function About() {
	return (
		<div className='about-page'>
			{}
			<div className='bg-orb bg-orb-1'></div>
			<div className='bg-orb bg-orb-2'></div>
			<div className='bg-orb bg-orb-3'></div>

			<div className='about-content'>
				<h1 className='about-wordmark'>Pulseroom</h1>
				<p className='about-tagline'>Real-time collaborative music, reimagined.</p>

				<p className='about-desc'>
					Connect your Spotify, create a room, and invite friends —
					everyone adds songs to a shared queue and controls the
					music together, live.
				</p>

				<div className='about-meta'>
					<span className='meta-item'>Built by <strong>Nikhil</strong> @yadavnikhil03</span>
					<span className='meta-dot'>·</span>
					<span className='meta-item'>React · Node · MongoDB · Socket.io</span>
				</div>

				<Link to='/' className='back-home-btn'>
					<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
						<path d='M19 12H5' /><path d='M12 19l-7-7 7-7' />
					</svg>
					Back to Home
				</Link>
			</div>

			<footer className='about-footer'>
				<span className='footer-copy'>© 2026 Pulseroom</span>
			</footer>
		</div>
	);
}

export default About;
