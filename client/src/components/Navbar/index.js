import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AudioLines, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/AuthContext';
import './style.css';

const Navbar = () => {
  const { user: accountUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Home', path: '/home' },
    { label: 'Create Room', path: '/create' },
    { label: 'Join Room', path: '/room' },
    { label: 'About', path: '/about' },
  ];

  return (
    <nav className="app-navbar" aria-label="Main navigation">
      <div className="app-nav-inner">
        <Link to="/home" className="app-nav-brand">
          <span className="app-nav-brand-mark">
            <AudioLines size={19} />
          </span>
          <span>Pulseroom</span>
        </Link>

        <div className="app-nav-links">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`app-nav-link ${location.pathname === link.path ? 'is-active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="app-nav-actions">
          {accountUser ? (
            <div className="app-nav-profile">
              <button
                type="button"
                className="app-nav-profile-trigger"
                onClick={() => setProfileOpen(p => !p)}
                onBlur={() => setTimeout(() => setProfileOpen(false), 150)}
                aria-haspopup="true"
                aria-expanded={profileOpen}
              >
                <span className="app-nav-avatar">{accountUser.name.charAt(0).toUpperCase()}</span>
                <span className="app-nav-user">{accountUser.name}</span>
              </button>
              {profileOpen && (
                <div className="app-nav-dropdown" role="menu">
                  <div className="app-nav-dropdown-user">
                    <span className="app-nav-dropdown-avatar">{accountUser.name.charAt(0).toUpperCase()}</span>
                    <div>
                      <strong>{accountUser.name}</strong>
                      <small>{accountUser.email}</small>
                    </div>
                  </div>
                  <div className="app-nav-dropdown-divider" />
                  <button
                    type="button"
                    className="app-nav-dropdown-item app-nav-dropdown-logout"
                    onClick={logout}
                    role="menuitem"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/" className="app-nav-login-btn">
              Sign in
            </Link>
          )}
        </div>

        <button
          type="button"
          className="app-nav-mobile-toggle"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(o => !o)}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="app-nav-mobile-menu">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className="app-nav-mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {accountUser ? (
            <button
              type="button"
              className="app-nav-mobile-logout"
              onClick={() => { setMobileMenuOpen(false); logout(); }}
            >
              Sign out · {accountUser.name}
            </button>
          ) : (
            <Link to="/" className="app-nav-mobile-link" onClick={() => setMobileMenuOpen(false)}>
              Sign in
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
