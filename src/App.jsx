import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase.js';
import LoginPage from './pages/LoginPage.jsx';
import QuinielasPage from './pages/QuinielasPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import './index.css';

async function fetchMeta(userId) {
  try {
    const { data } = await supabase
      .from('users_meta')
      .select('*')
      .eq('user_id', userId)
      .single();
    return data || null;
  } catch (e) {
    return null;
  }
}

async function createMeta(userId, username) {
  try {
    await supabase.from('users_meta').upsert({
      user_id: userId,
      username: username || 'Usuario',
      confirmed: false,
      is_admin: false,
    }, { onConflict: 'user_id' });
  } catch (e) {
    console.error('Error creating meta:', e);
  }
}

export default function App() {
  const [session, setSession] = useState(null);
  const [userMeta, setUserMeta] = useState(null);
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState('quiniela');

  async function loadSessionAndMeta(sess) {
    if (!sess?.user?.id) return;

    let meta = await fetchMeta(sess.user.id);

    // If no meta found, create it from the session data
    if (!meta) {
      const username = sess.user.user_metadata?.username || 
                       sess.user.email?.split('@')[0] || 
                       'Usuario';
      await createMeta(sess.user.id, username);
      // Try fetching again
      meta = await fetchMeta(sess.user.id);
    }

    setSession(sess);
    setUserMeta(meta);
  }

  useEffect(() => {
    async function init() {
      try {
        const { data: { session: sess } } = await supabase.auth.getSession();
        if (sess?.user?.id) {
          await loadSessionAndMeta(sess);
        }
      } catch (e) {
        console.error('Init error:', e);
      }
      setReady(true);
    }

    const timer = setTimeout(() => setReady(true), 8000);
    init().finally(() => clearTimeout(timer));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      if (!sess) {
        setSession(null);
        setUserMeta(null);
        setPage('quiniela');
        return;
      }
      await loadSessionAndMeta(sess);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    try { await supabase.auth.signOut({ scope: 'global' }); } catch (e) {}
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) localStorage.removeItem(key);
    });
    setSession(null);
    setUserMeta(null);
    setPage('quiniela');
    window.location.reload();
  }

  if (!ready) {
    return (
      <div className="loading-screen">
        <div className="loading-ball">⚽</div>
        <p>Cargando quiniela...</p>
      </div>
    );
  }

  if (!session) return <LoginPage />;

  const isAdmin = userMeta?.is_admin === true;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-logo">
            <span className="logo-ball">⚽</span>
            <span className="logo-text">Quiniela <strong>2026</strong></span>
          </div>
          <nav className="header-nav">
            <button className={page === 'quiniela' ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('quiniela')}>Mi Quiniela</button>
            <button className={page === 'leaderboard' ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('leaderboard')}>Tabla General</button>
            {isAdmin && (
              <button className={page === 'admin' ? 'nav-btn active admin' : 'nav-btn admin'} onClick={() => setPage('admin')}>⚙ Admin</button>
            )}
          </nav>
          <div className="header-user">
            <span className="username-badge">{userMeta?.username || 'Usuario'}</span>
            <button className="logout-btn" onClick={handleLogout}>Salir</button>
          </div>
        </div>
      </header>
      <main className="app-main">
        {page === 'quiniela' && <QuinielasPage session={session} userMeta={userMeta} />}
        {page === 'leaderboard' && <LeaderboardPage session={session} userMeta={userMeta} />}
        {page === 'admin' && isAdmin && <AdminPage session={session} />}
      </main>
    </div>
  );
}
