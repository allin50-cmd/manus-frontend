import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';

/**
 * Redirect /signup to the landing page with the signup modal open.
 * This unifies the signup experience through the polished LandingSignupModal
 * instead of maintaining a separate standalone form.
 */
export default function Signup() {
  usePageTitle('Create Account');
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/dashboard');
    } else {
      // Preserve any query params (e.g. ?service=CompaniesHouse)
      const params = new URLSearchParams(window.location.search);
      params.set('signup', 'true');
      setLocation(`/?${params.toString()}`);
    }
  }, [isAuthenticated, setLocation]);

  return null;
}
