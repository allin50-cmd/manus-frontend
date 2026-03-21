import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/fineguard/Layout';
import { Shield } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Shield className="w-10 h-10 text-fg-muted mb-4" />
        <h2 className="text-lg font-semibold text-white mb-2">Page not found</h2>
        <p className="text-fg-muted text-sm mb-6">This page doesn't exist.</p>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-fg-gold hover:text-fg-gold-hover transition-colors"
        >
          Go home
        </button>
      </div>
    </Layout>
  );
}
