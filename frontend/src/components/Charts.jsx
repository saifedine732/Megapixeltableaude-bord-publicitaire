import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend
);

const gridColor = '#e7eaf3';
const textColor = '#5b6178';
const fmtUSD = (n) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtCompact = (n) => Intl.NumberFormat('en-US', { notation: 'compact' }).format(n);

const truncate = (str, n) => (str.length > n ? str.slice(0, n - 1).trimEnd() + '…' : str);

export function TrendChart({ monthly }) {
  return (
    <Bar
      data={{
        labels: monthly.map((d) => d.month),
        datasets: [
          { label: 'Dépense (USD)', data: monthly.map((d) => d.spend), backgroundColor: '#2954e2', borderRadius: 4, yAxisID: 'y' },
          { label: 'Impressions', data: monthly.map((d) => d.impressions), type: 'line', borderColor: '#16a34a', yAxisID: 'y1' },
        ],
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor } } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor } },
          y: { position: 'left', grid: { color: gridColor }, ticks: { color: textColor, callback: (v) => '$' + v } },
          y1: { position: 'right', grid: { display: false }, ticks: { color: textColor, callback: fmtCompact } },
        },
      }}
    />
  );
}

export function PlatformChart({ platform }) {
  const filtered = platform.filter((p) => p.spend > 0);
  return (
    <Doughnut
      data={{
        labels: filtered.map((p) => p.platform),
        datasets: [{
          data: filtered.map((p) => p.spend),
          backgroundColor: ['#2954e2', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed'],
          borderColor: '#ffffff',
          borderWidth: 3,
        }],
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: textColor } } },
      }}
    />
  );
}

export function CampaignChart({ campaigns }) {
  return (
    <Bar
      data={{
        labels: campaigns.map((c) => truncate(c.campaign, 38)),
        datasets: [{ data: campaigns.map((c) => c.spend), backgroundColor: '#2954e2', borderRadius: 4 }],
      }}
      options={{
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor } },
          y: {
            afterFit: (scale) => { scale.width = 260; },
            grid: { display: false },
            ticks: { color: textColor, font: { size: 10 } },
          },
        },
      }}
    />
  );
}

export function ObjectiveChart({ objective }) {
  return (
    <Bar
      data={{
        labels: objective.map((o) => o.objective),
        datasets: [{ data: objective.map((o) => o.spend), backgroundColor: '#16a34a', borderRadius: 4 }],
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false }, ticks: { color: textColor, font: { size: 9 } } }, y: { grid: { color: gridColor }, ticks: { color: textColor } } },
      }}
    />
  );
}

export function PlacementChart({ placement }) {
  return (
    <Bar
      data={{
        labels: placement.map((p) => p.placement),
        datasets: [{ data: placement.map((p) => p.spend), backgroundColor: '#f59e0b', borderRadius: 4 }],
      }}
      options={{
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { color: gridColor }, ticks: { color: textColor } }, y: { grid: { display: false }, ticks: { color: textColor } } },
      }}
    />
  );
}

export function DailyChart({ daily }) {
  return (
    <Line
      data={{
        labels: daily.map((d) => d.date),
        datasets: [{
          label: 'Dépense',
          data: daily.map((d) => d.spend),
          borderColor: '#2954e2',
          backgroundColor: 'rgba(41,84,226,0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
        }],
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false }, ticks: { color: textColor, maxTicksLimit: 8, font: { size: 9 } } }, y: { grid: { color: gridColor }, ticks: { color: textColor } } },
      }}
    />
  );
}