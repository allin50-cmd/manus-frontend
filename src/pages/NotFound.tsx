import { Link } from 'react-router-dom';
import { Shield, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <Shield className="w-16 h-16 text-[#C9A64A] mx-auto mb-6 opacity-50" />
        <h1 className="text-6xl font-bold text-[#1A1A1A] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">Page Not Found</h2>
        <p className="text-gray-500 mb-8">
          This page doesn't exist or has been moved. Let's get you back on track.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/">
            <Button className="bg-[#C9A64A] hover:bg-[#B8954A] text-white gap-2">
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
