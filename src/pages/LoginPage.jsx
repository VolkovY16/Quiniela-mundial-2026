import { useState } from 'react';
import { loginUser, loginAdmin, supabase } from '../lib/supabase.js';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [adminMode, setAdminMode] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (adminMode) {
        await loginAdmin(adminPass);
      } else {
        if (!username.trim()) { setError('Escribe tu nombre'); setLoading(false); return; }
        const { user, isNew } = await loginUser(username.trim());
        if (isNew && user) {
          // Save username in users_meta
          await supabase.from('users_meta').insert({
            user_id: user.id,
            username: username.trim(),
            confirmed: false,
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-trophy">🏆</div>
          <h1>Quiniela <span>Mundial 2026</span></h1>
          <p>México · Estados Unidos · Canadá</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {!adminMode ? (
            <>
              <label>Tu nombre</label>
              <input
                type="text"
                placeholder="Ej: Carlos, Ana, Pepe..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
                maxLength={30}
              />
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Entrando...' : 'Entrar a mi quiniela →'}
              </button>
            </>
          ) : (
            <>
              <label>Contraseña de administrador</label>
              <input
                type="password"
                placeholder="Contraseña admin"
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                autoFocus
              />
              <button type="submit" disabled={loading} className="btn-admin">
                {loading ? 'Verificando...' : 'Entrar como Admin'}
              </button>
            </>
          )}

          {error && <p className="login-error">{error}</p>}
        </form>

        <div className="login-footer">
          <button className="admin-toggle" onClick={() => { setAdminMode(!adminMode); setError(''); }}>
            {adminMode ? '← Volver al login normal' : '⚙ Acceso administrador'}
          </button>
        </div>
      </div>

      <div className="login-bg-flags">
        🇲🇽 🇺🇸 🇨🇦 🇧🇷 🇦🇷 🇩🇪 🇫🇷 🇪🇸 🏴󠁧󠁢󠁥󠁮󠁧󠁿 🇵🇹 🇳🇱 🇧🇪
      </div>
    </div>
  );
}
