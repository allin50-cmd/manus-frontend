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
    <div className="min-h-screen bg-gradient-to-br from-[#0A0B14] via-[#111327] to-[#0A0B14] flex flex-col">
      <Header />
      <main className={`flex-1 ${isAuthenticated ? 'pb-20 lg:pb-0' : ''}`}>
        {children}
      </main>
      {!hideFooter && <Footer />}
      <MobileNav />
    </div>
  );
}
