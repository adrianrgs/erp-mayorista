import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DialogProvider } from './components/ui/DialogProvider';
import { AuthProvider } from './context/AuthContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <DialogProvider>
        <App />
      </DialogProvider>
    </AuthProvider>
  </StrictMode>,
);
