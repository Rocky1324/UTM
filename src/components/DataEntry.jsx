import React, { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';

export default function DataEntry({ data, material }) {
  const tableContainerRef = useRef(null);

  // Auto-scroll to the bottom of the table when new data points arrive
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
    }
  }, [data.length]);

  return (
    <div className="card fade-in journal-container" style={{ animationDelay: '0.1s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h2 style={{ margin: 0 }}><Activity size={20} className="text-accent" /> Journal d'Essai</h2>
        <span className="badge badge-success no-print" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
          {data.length} pts
        </span>
      </div>
      
      <div 
        ref={tableContainerRef} 
        className="table-wrapper"
      >
        <table style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 1 }}>
            <tr>
              <th style={{ padding: '0.4rem 0.5rem', fontSize: '0.7rem' }}>Index</th>
              <th style={{ padding: '0.4rem 0.5rem', fontSize: '0.7rem' }}>F (kN)</th>
              <th style={{ padding: '0.4rem 0.5rem', fontSize: '0.7rem' }}>ΔL (mm)</th>
              <th style={{ padding: '0.4rem 0.5rem', fontSize: '0.7rem' }}>σ (MPa)</th>
              <th style={{ padding: '0.4rem 0.5rem', fontSize: '0.7rem' }}>ε (%)</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state" style={{ padding: '1rem', fontSize: '0.75rem' }}>
                  Aucune donnée disponible.
                </td>
              </tr>
            ) : (
              data.map((point, index) => (
                <tr key={point.id || index} className="fade-in" style={{ animationDuration: '0.2s' }}>
                  <td style={{ padding: '0.35rem 0.5rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>#{point.id || index + 1}</td>
                  <td style={{ padding: '0.35rem 0.5rem', fontFamily: 'monospace', fontSize: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>{(point.force / 1000).toFixed(3)}</td>
                  <td style={{ padding: '0.35rem 0.5rem', fontFamily: 'monospace', fontSize: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>{point.deltaL.toFixed(3)}</td>
                  <td style={{ padding: '0.35rem 0.5rem', fontWeight: 'bold', color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>{point.stress.toFixed(2)}</td>
                  <td style={{ padding: '0.35rem 0.5rem', color: 'var(--accent)', fontFamily: 'monospace', fontSize: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>{(point.strain * 100).toFixed(3)}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
