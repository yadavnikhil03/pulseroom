import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';

/**
 * ProtectedRoute — wraps any page that requires an authenticated PulseRoom account.
 * If the user is not logged in, they are redirected to `/`.
 */
export const ProtectedRoute = ({ children }) => {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <div className="page-loading">Loading account…</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * GuestRoute — wraps login/landing pages.
 * If the user is already logged in, they are redirected to `/home`.
 */
export const GuestRoute = ({ children }) => {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <div className="page-loading">Loading account…</div>;
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return children;
};
