import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase.js';
import LoginPage from './pages/LoginPage.jsx';
import QuinielasPage from './pages/QuinielasPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import './index.css';

export default function App() {
  const [session, setSession] = useState(null);
  const [userMeta, setUserMeta] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [page, setPage] = useState('quiniela');

  const fetchUserMeta = useCallback(async (userId) => {
    setLoadingMeta(true);
    try {
      const { data } = await supabase
        .from('users_meta')
        .select('*')
        .eq('user_id', userId)
        .single();
      setUserMeta(data || null);
    } catch (e) {
      setUserMeta(null);
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess || null);
      if (sess) {
        fetchUserMeta(sess.user.id).finally(() => setLoadingAuth(false));
      } else {
        setLoadingAuth(false);
      }
    }).catch(() => setLoadingAuth(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess || null);
      if (sess) {
        await fetchUserMeta(sess.user.id);
      } else {
        setUserMeta(null);
        setPage('quiniela');
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserMeta]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setUserMeta(null);
    setPage('quiniela');
  }

  if (loadingAuth || loadingMeta) {
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
