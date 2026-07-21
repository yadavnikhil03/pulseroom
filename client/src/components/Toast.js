import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Toast.css';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++counterRef.current;
    setToasts(prev => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {createPortal(
        <div className="toast-container" aria-live="polite">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast toast-${toast.type}`} role="alert">
              <span className="toast-message">{toast.message}</span>
              <button className="toast-close" onClick={() => removeToast(toast.id)} aria-label="Dismiss">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
