import { useState, useEffect } from 'react';
import SignInScreen from './components/SignInScreen.tsx';
import SlotPicker from './components/SlotPicker.tsx';

export interface User {
  email: string;
  name: string;
}

const THEMES = {
  october: '/images/ot-cover-october.png',
  december: '/images/ot-cover-december.png',
} as const;

type ThemeId = keyof typeof THEMES;

function resolveTheme(): { id: ThemeId | null; coverImage: string } {
  const param = new URLSearchParams(window.location.search).get('theme') ?? '';
  if (param in THEMES) {
    return { id: param as ThemeId, coverImage: THEMES[param as ThemeId] };
  }
  return { id: null, coverImage: '/images/ot-cover.png' };
}

const theme = resolveTheme();

// Run synchronously before first render so Dark Reader sees these before analyzing.
if (theme.id) {
  document.documentElement.dataset.theme = theme.id;
}
// October: Dark Reader shifts orange to green, so lock the page entirely.
// Default and December: let Dark Reader run (yellow darkens slightly, green darkens slightly).
if (theme.id === 'october') {
  const meta = document.createElement('meta');
  meta.name = 'darkreader-lock';
  document.head.appendChild(meta);
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh bg-ot-yellow flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-ot-onbg border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <SignInScreen onSignIn={setUser} coverImage={theme.coverImage} />;
  }

  return <SlotPicker user={user} onSignOut={() => setUser(null)} coverImage={theme.coverImage} />;
}
