const fmtUSD = (n) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtNum = (n) => n.toLocaleString('en-US');
const fmtCompact = (n) => Intl.NumberFormat('en-US', { notation: 'compact' }).format(n);

export function StatCards({ totals }) {
  const cpm = (totals.spend / totals.impressions) * 1000;
  const stats = [
    { label: 'Dépense totale', value: fmtUSD(totals.spend)  },
    { label: 'Impressions', value: fmtCompact(totals.impressions), sub: fmtNum(totals.impressions) + ' vues' },
    { label: 'Campagnes actives', value: totals.campaigns},
    { label: 'CPM moyen', value: '$' + cpm.toFixed(2)},
  ];
  return (
    <div className="stats">
      {stats.map((s) => (
        <div className="stat" key={s.label}>
          <div className="stat-label">{s.label}</div>
          <div className="stat-value">{s.value}</div>
          <div className="stat-sub">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}