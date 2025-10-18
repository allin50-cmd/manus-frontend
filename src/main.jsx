import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.addEventListener('error', (e) => {
  console.error('Global error:', e.error, e.message);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

try {
  console.log('Starting React app...');
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  console.log('React app rendered');
} catch (error) {
  console.error('Render error:', error);
  document.body.innerHTML = '<div style="color:red;padding:50px;font-size:20px;">Error: ' + error.message + '</div>';
}

