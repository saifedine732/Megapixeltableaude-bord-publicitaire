import { useState } from 'react';

export function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const resetMessages = () => {
    setError('');
    setInfo('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur de connexion');
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', data.email);
      onLogin(data.email);
    } catch (err) {
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setInfo(data.message || 'Si un compte existe, un code a été généré.');
      setMode('reset');
    } catch (err) {
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetCode, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la réinitialisation');
        return;
      }
      setInfo('Mot de passe changé. Tu peux te connecter avec le nouveau.');
      setMode('login');
      setResetCode('');
      setNewPassword('');
      setPassword('');
    } catch (err) {
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <img src="/LOGO.png" alt="Megapixel" className="login-logo-img" />

        <h1>Megapixel</h1>

        {mode === 'login' && (
          <>
            <p className="login-subtitle">Connectez-vous à votre espace analytique</p>
            {error && <p className="login-error">{error}</p>}
            {info && <p className="login-info">{info}</p>}
            <form onSubmit={handleLogin}>
              <label htmlFor="login-email">Adresse email</label>
              <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nom@exemple.com" required />

              <div className="login-row">
                <label htmlFor="login-password">Mot de passe</label>
                <a href="#" onClick={(e) => { e.preventDefault(); resetMessages(); setMode('forgot'); }}>Mot de passe oublié ?</a>
              </div>
              <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" required />

              <button type="submit" disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</button>
            </form>
          </>
        )}

        {mode === 'forgot' && (
          <>
            <p className="login-subtitle">Réinitialiser le mot de passe</p>
            {error && <p className="login-error">{error}</p>}
            <form onSubmit={handleForgot}>
              <label htmlFor="forgot-email">Adresse email</label>
              <input id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nom@exemple.com" required />
              <button type="submit" disabled={loading}>{loading ? 'Envoi...' : 'Envoyer le code'}</button>
            </form>
            <p className="login-switch">
              <a href="#" onClick={(e) => { e.preventDefault(); resetMessages(); setMode('login'); }}>Retour à la connexion</a>
            </p>
          </>
        )}

        {mode === 'reset' && (
          <>
            <p className="login-subtitle">Entre le code reçu et ton nouveau mot de passe</p>
            {error && <p className="login-error">{error}</p>}
            {info && <p className="login-info">{info}</p>}
            <form onSubmit={handleReset}>
              <label htmlFor="reset-code">Code de réinitialisation</label>
              <input id="reset-code" type="text" value={resetCode} onChange={(e) => setResetCode(e.target.value)} placeholder="Collé depuis le terminal du serveur" required />

              <label htmlFor="reset-password">Nouveau mot de passe</label>
              <input id="reset-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="6 caractères minimum" required />

              <button type="submit" disabled={loading}>{loading ? 'Réinitialisation...' : 'Réinitialiser'}</button>
            </form>
            <p className="login-switch">
              <a href="#" onClick={(e) => { e.preventDefault(); resetMessages(); setMode('login'); }}>Retour à la connexion</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}