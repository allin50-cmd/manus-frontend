import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CheckCompany from './pages/fineguard/CheckCompany';
import ResultPage from './pages/fineguard/ResultPage';
import MonitoringPage from './pages/fineguard/MonitoringPage';
import AlertsPage from './pages/fineguard/AlertsPage';
import NotFound from './pages/fineguard/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* FineGuard core workflow */}
        <Route path="/" element={<CheckCompany />} />
        <Route path="/company/:number" element={<ResultPage />} />
        <Route path="/monitoring/:companyId" element={<MonitoringPage />} />
        <Route path="/alerts" element={<AlertsPage />} />

        {/* Fallback */}
        <Route path="/check" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
