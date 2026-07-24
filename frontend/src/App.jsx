import { useState, useEffect } from 'react';
import { StatCards } from './components/StatCards';
import { TrendChart, PlatformChart, CampaignChart, ObjectiveChart, PlacementChart, DailyChart } from './components/Charts';
import './App.css';

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/dashboard-stats')
      .then((res) => res.json())
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p style={{ color: '#ff3d81' }}>Erreur : {error}</p>;
  if (!data) return <p>Chargement...</p>;

  return (
    <div className="wrap">
      <header>
        <div className="brand">
         
          <div>
            <div className="eyebrow">Rapport de campagnes</div>
            <h1>Megapixel Tableau de bord publicitaire</h1>
          </div>
        </div>
        <div className="period">Période analysée<br /><b>{data.totals.dateMin} → {data.totals.dateMax}</b></div>
      </header>

      <StatCards totals={data.totals} />

      <div className="grid">
        <div className="panel">
          <h2>Évolution mensuelle</h2>
          <div className="chart-box tall"><TrendChart monthly={data.monthly} /></div>
        </div>
        <div className="panel">
          <h2>Répartition par plateforme</h2>
          <div className="chart-box tall"><PlatformChart platform={data.platform} /></div>
        </div>
      </div>

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

      
    </div>
  );
}

export default App;