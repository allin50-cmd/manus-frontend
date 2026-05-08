import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { SearchX, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <SearchX className="w-12 h-12 text-[#5A4BFF]" />
          </div>
        </div>

        {/* 404 */}
        <p className="text-8xl font-extrabold text-[#5A4BFF] mb-4 leading-none tracking-tight">
          404
        </p>

        {/* Headline */}
        <h1 className="text-3xl font-bold text-white mb-3">Page not found</h1>

        {/* Subtext */}
        <p className="text-gray-400 text-base mb-10 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => setLocation('/')}
            className="w-full sm:w-auto bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-6 py-2 h-10 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go home
          </Button>
          <Button
            onClick={() => setLocation('/vaultline')}
            variant="outline"
            className="w-full sm:w-auto border-white/20 text-gray-300 hover:bg-white/10 hover:text-white px-6 py-2 h-10 font-medium bg-transparent"
          >
            View products
          </Button>
        </div>
      </div>
    </div>
  );
}
