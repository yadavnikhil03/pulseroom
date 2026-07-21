import React from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';

import './index.css';
import App from './App';
import { AuthProvider } from './hooks/AuthContext';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(<AuthProvider><App /></AuthProvider>);
