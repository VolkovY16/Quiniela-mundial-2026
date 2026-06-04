import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase.js';
import LoginPage from './pages/LoginPage.jsx';
import QuinielasPage from './pages/QuinielasPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import './index.css';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = still loading
  const [userMeta, setUserMeta] = useState(null);
  const [page, setPage] = useState('quiniela');

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess || null);
      if (sess) fetchUserMeta(sess.user.id);
    });

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess || null);
      if (sess) {
        await fetchUserMeta(sess.user.id);
      } else {
        setUserMeta(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserMeta(userId) {
    try {
      const { data } = await supabase
        .from('users_meta')
        .select('*')
        .eq('user_id', userId)
        .single();
      setUserMeta(data || null);
    } catch (e) {
      setUserMeta(null);
    }
  }

  // Still loading
  if (session === undefined) {
    return (
      <div className="loading-screen">
        <div className="loading-ball">⚽</div>
        <p>Cargando quiniela...</p>
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return <LoginPage />;
  }

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
            <button className={page === 'quiniela' ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('quiniela')}>
              Mi Quiniela
            </button>
            <button className={page === 'leaderboard' ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('leaderboard')}>
              Tabla General
            </button>
            {isAdmin && (
              <button className={page === 'admin' ? 'nav-btn active admin' : 'nav-btn admin'} onClick={() => setPage('admin')}>
                ⚙ Admin
              </button>
            )}
          </nav>
          <div className="header-user">
            <span className="username-badge">{userMeta?.username || session.user.email?.split('@')[0]}</span>
            <button className="logout-btn" onClick={() => supabase.auth.signOut()}>Salir</button>
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
