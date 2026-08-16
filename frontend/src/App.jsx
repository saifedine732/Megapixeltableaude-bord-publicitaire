import { useState, useEffect } from 'react';
import { StatCards } from './components/StatCards';
import { TrendChart, PlatformChart, CampaignChart, ObjectiveChart, PlacementChart, DailyChart } from './components/Charts';
import { LoginPage } from './components/LoginPage';
import './App.css';

const NAV_ITEMS = [
  { id: 'vue-globale', label: 'Vue globale' },
  { id: 'par-campagne', label: 'Par campagne' },
  { id: 'par-plateforme', label: 'Par plateforme' },
  { id: 'emplacements', label: 'Emplacements & dépense' },
];

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [activeView, setActiveView] = useState('vue-globale');

  useEffect(() => {
    fetch('/api/dashboard-stats')
      .then((res) => res.json())
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (!loggedIn) {
    return <LoginPage onLogin={(email) => { setLoggedIn(true); setUserEmail(email); }} />;
  }

  if (error) return <p style={{ color: '#dc2626' }}>Erreur : {error}</p>;
  if (!data) return <p>Chargement...</p>;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setLoggedIn(false);
    setUserEmail('');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/LOGO.png" alt="Megapixel" className="sidebar-logo-img" />
          <div className="sidebar-logo-text">
            <b>Megapixel</b>
            <span>Rapport publicitaire</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Navigation</div>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href="#"
              className={activeView === item.id ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); setActiveView(item.id); }}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">{userEmail}</div>
          <button className="logout-btn" onClick={handleLogout}>Se déconnecter</button>
        </div>
      </aside>

      <div className="main-content">
        <div className="wrap">
          <header>
            <div className="brand">
              <div className="eyebrow">Rapport de campagnes · Meta Ads</div>
              <h1>Megapixel : Tableau de bord publicitaire</h1>
            </div>
            <div className="period">
              Période analysée
              <br />
              <b>{data.totals.dateMin} → {data.totals.dateMax}</b>
            </div>
          </header>

          {activeView === 'vue-globale' && (
            <>
              <StatCards totals={data.totals} />
              <div className="grid grid-single">
                <div className="panel">
                  <h2>Évolution mensuelle</h2>
                  <div className="chart-box tall"><TrendChart monthly={data.monthly} /></div>
                </div>
              </div>
            </>
          )}

          {activeView === 'par-campagne' && (
            <div className="grid-2">
              <div className="panel">
                <h2>Top 10 campagnes</h2>
                <div className="chart-box tall"><CampaignChart campaigns={data.topCampaigns} /></div>
              </div>
              <div className="panel">
                <h2>Objectifs de campagne</h2>
                <div className="chart-box tall"><ObjectiveChart objective={data.objective} /></div>
              </div>
            </div>
          )}

          {activeView === 'par-plateforme' && (
            <div className="grid grid-single">
              <div className="panel">
                <h2>Répartition par plateforme</h2>
                <div className="chart-box tall"><PlatformChart platform={data.platform} /></div>
              </div>
            </div>
          )}

          {activeView === 'emplacements' && (
            <div className="grid-2">
              <div className="panel">
                <h2>Emplacements publicitaires</h2>
                <div className="chart-box"><PlacementChart placement={data.placement} /></div>
              </div>
              <div className="panel">
                <h2>Dépense quotidienne</h2>
                <div className="chart-box"><DailyChart daily={data.daily} /></div>
              </div>
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
}

export default App;