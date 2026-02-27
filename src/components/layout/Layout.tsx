import React from 'react';
import Header from './Header';
import Footer from './Footer';
import MobileNav from './MobileNav';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

export default function Layout({ children, hideFooter }: LayoutProps) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="theme-gradient min-h-screen bg-gradient-to-br from-[#0A0B14] via-[#111327] to-[#0A0B14] flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#5A4BFF] focus:text-white focus:rounded-lg focus:text-sm focus:font-bold focus:outline-none"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className={`flex-1 ${isAuthenticated ? 'pb-20 lg:pb-0' : ''}`}>
        {children}
      </main>
      {!hideFooter && <Footer />}
      <MobileNav />
    </div>
  );
}
