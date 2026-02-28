import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-[#5A4BFF] text-white shadow-lg shadow-[#5A4BFF]/25 flex items-center justify-center hover:bg-[#6B5BFF] transition-all hover:scale-110 animate-in fade-in duration-200"
      aria-label="Back to top"
    >
      <ArrowUp size={18} />
    </button>
  );
}
