import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { LineChart } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function StressStrainChart({ data, material, status }) {
  // Find key characteristic points in the current data
  const hasPoints = data.length > 0;
  
  // Find maximum stress point (Rm)
  const maxStressPoint = hasPoints 
    ? data.reduce((max, p) => p.stress > max.stress ? p : max, data[0])
    : null;

  // Find yield point (Re) if applicable
  const yieldPoint = hasPoints && material.Re
    ? data.find(p => p.stress >= material.Re) || null
    : null;

  // Find last point (rupture)
  const lastPoint = hasPoints ? data[data.length - 1] : null;

  const datasets = [
    {
      label: `Courbe Contrainte-Déformation - ${material.name}`,
      data: data.map(p => ({ x: p.strain, y: p.stress })),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      borderWidth: 3,
      pointRadius: 0, // Sleek line without points
      pointHoverRadius: 6,
      fill: true,
      tension: material.key === 'concrete' || material.key === 'concrete_lime' ? 0 : 0.05,
    }
  ];

  // Draw yield limit marker and reference lines if yield point is reached
  if (yieldPoint) {
    datasets.push(
      // Yield point marker
      {
        label: `Limite Élastique Rₑ (${material.Re} MPa)`,
        data: [{ x: yieldPoint.strain, y: yieldPoint.stress }],
        borderColor: '#fbbf24',
        backgroundColor: '#fbbf24',
        pointRadius: 6,
        pointHoverRadius: 8,
        pointStyle: 'circle',
        showLine: false
      },
      // Horizontal helper line for Re
      {
        label: '',
        data: [{ x: 0, y: yieldPoint.stress }, { x: yieldPoint.strain, y: yieldPoint.stress }],
        borderColor: 'rgba(251, 191, 36, 0.4)',
        borderWidth: 1,
        borderDash: [4, 4],
        pointRadius: 0,
        showLine: true,
        fill: false
      }
    );
  }

  // Draw ultimate strength and rupture lines
  if (status === 'ruptured' && maxStressPoint && lastPoint) {
    datasets.push(
      // Ultimate strength point (UTS / Rm)
      {
        label: `Résistance Traction Rₘ (${maxStressPoint.stress.toFixed(1)} MPa)`,
        data: [{ x: maxStressPoint.strain, y: maxStressPoint.stress }],
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
        pointRadius: 8,
        pointHoverRadius: 10,
        pointStyle: 'rectRot',
        showLine: false
      },
      // Rupture point marker
      {
        label: `Point de Rupture (ε_f = ${(lastPoint.strain * 100).toFixed(lastPoint.strain < 0.001 ? 3 : 1)}%)`,
        data: [{ x: lastPoint.strain, y: lastPoint.stress }],
        borderColor: '#f87171',
        backgroundColor: '#7f1d1d',
        pointRadius: 7,
        pointHoverRadius: 9,
        pointStyle: 'cross',
        showLine: false
      },
      // Vertical line to x-axis from rupture point
      {
        label: '',
        data: [{ x: lastPoint.strain, y: 0 }, { x: lastPoint.strain, y: lastPoint.stress }],
        borderColor: 'rgba(239, 68, 68, 0.4)',
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointRadius: 0,
        showLine: true,
        fill: false
      },
      // Horizontal line to y-axis from Rm point
      {
        label: '',
        data: [{ x: 0, y: maxStressPoint.stress }, { x: maxStressPoint.strain, y: maxStressPoint.stress }],
        borderColor: 'rgba(239, 68, 68, 0.4)',
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointRadius: 0,
        showLine: true,
        fill: false
      }
    );
  }

  // Dynamically calculate nice axis ranges
  const maxStrain = material.Ef || 0.2;
  const maxStress = material.Rm || 400;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 11, weight: '500' },
          // Hide legend items for the helper lines
          filter: (legendItem) => legendItem.text !== ''
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            if (label === '') return null;
            return `Contrainte σ: ${context.parsed.y.toFixed(1)} MPa | Déformation ε: ${(context.parsed.x * 100).toFixed(context.parsed.x < 0.001 ? 4 : 2)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        min: 0,
        max: maxStrain * 1.08, // Add a bit of space on the right
        title: {
          display: true,
          text: 'Déformation relative ε (mm/mm)',
          color: '#94a3b8',
          font: { family: 'Inter', size: 12, weight: '600' }
        },
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: { 
          color: '#64748b',
          // Show scientific notation or percentage formatting if strain is tiny (like concrete)
          callback: function(value) {
            if (maxStrain < 0.001) {
              return value.toExponential(1);
            }
            return value.toFixed(2);
          }
        }
      },
      y: {
        min: 0,
        max: maxStress * 1.1, // Add space on top
        title: {
          display: true,
          text: 'Contrainte σ (MPa)',
          color: '#94a3b8',
          font: { family: 'Inter', size: 12, weight: '600' }
        },
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: { color: '#64748b' }
      }
    }
  };

  return (
    <div className="card fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', animationDelay: '0.2s' }}>
      <h2 style={{ margin: 0 }}><LineChart size={24} className="text-primary" /> Graphique Contrainte-Déformation</h2>
      <div className="chart-container" style={{ flex: 1, minHeight: '300px', position: 'relative' }}>
        {!hasPoints ? (
          <div className="empty-state" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Sélectionnez un matériau et cliquez sur "Lancer le test de traction virtuel" pour afficher la courbe
          </div>
        ) : (
          <Line data={{ datasets }} options={options} />
        )}
      </div>
    </div>
  );
}
