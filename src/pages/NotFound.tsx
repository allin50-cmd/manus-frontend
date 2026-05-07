import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home, CalendarDays } from 'lucide-react';
import MainNav from '@/components/MainNav';

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#0F1014] text-white">
      <MainNav />

      {/* Decorative background blur */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#5A4BFF]/10 blur-[120px]" />
      </div>

      <div className="relative flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="text-center max-w-lg mx-auto">
          <p className="text-[10rem] sm:text-[12rem] font-extrabold leading-none text-[#5A4BFF] select-none">
            404
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 -mt-4">
            Page not found
          </h1>
          <p className="text-gray-400 text-lg mb-10 leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => setLocation('/')}
              className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-7 py-5 text-base font-semibold w-full sm:w-auto"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
            <Button
              onClick={() => setLocation('/book-demo')}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 bg-transparent px-7 py-5 text-base font-medium w-full sm:w-auto"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Book a Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
