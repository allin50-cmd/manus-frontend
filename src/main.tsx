import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);

function reportVitals(metric: { name: string; value: number; rating: string }) {
  if (import.meta.env.DEV) {
    console.log(`[Web Vital] ${metric.name}: ${metric.value.toFixed(1)} (${metric.rating})`);
  }
}

onCLS(reportVitals);
onFCP(reportVitals);
onINP(reportVitals);
onLCP(reportVitals);
onTTFB(reportVitals);
