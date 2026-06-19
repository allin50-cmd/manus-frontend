import { useState, useEffect } from 'react';

export function CookieConsentBanner() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookie_consent');
    if (!accepted) setShown(true);
  }, []);

  if (!shown) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white p-4 text-sm">
      <p>This site uses cookies to improve your experience.</p>
      <button
        onClick={() => {
          localStorage.setItem('cookie_consent', 'true');
          setShown(false);
        }}
        className="mt-2 bg-blue-600 px-4 py-2 rounded"
      >
        Accept
      </button>
    </div>
  );
}
