import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import ErrorBoundary from './components/ErrorBoundary';
import ToastProvider from './components/Toast';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';
import analytics from './utils/analytics';

// Global error handler for uncaught errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    analytics.error(event.error || event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    analytics.error(event.reason || 'Unhandled Promise rejection');
  });
}

const Login = lazy(() => import('./pages/Login/index'));
const Home = lazy(() => import('./pages/Home/index'));
const Room = lazy(() => import('./pages/Room/index'));
const About = lazy(() => import('./pages/About/index'));
const CreateRoom = lazy(() => import('./pages/CreateRoom/index'));

import './App.css';

function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    const pageName = location.pathname === '/' ? 'login' : location.pathname.replace('/', '');
    analytics.pageView(pageName);
  }, [location]);
  return null;
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <ErrorBoundary>
          <PageTracker />
          <Suspense fallback={<div className="page-loading" style={{ minHeight: '100vh' }}>Loading…</div>}>
            <Routes>
              <Route path='/' element={<GuestRoute><Login /></GuestRoute>} />
              <Route path='/home' element={<Home />} />
              <Route path='/room' element={<Room />} />
              <Route path='/about' element={<About />} />
              <Route path='/create' element={<ProtectedRoute><CreateRoom /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </ToastProvider>
    </Router>
  );
}

export default App;
