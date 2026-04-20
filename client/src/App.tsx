import { useState, useEffect } from 'react';
import SignInScreen from './components/SignInScreen.tsx';
import SlotPicker from './components/SlotPicker.tsx';

export interface User {
  email: string;
  name: string;
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
        <div className="w-10 h-10 border-4 border-ot-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <SignInScreen onSignIn={setUser} />;
  }

  return <SlotPicker user={user} onSignOut={() => setUser(null)} />;
}
