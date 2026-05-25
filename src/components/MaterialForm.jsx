import React from 'react';
import { Box, User, FileText } from 'lucide-react';

export const MATERIALS_DB = {
  steel: {
    name: "Acier (S235)",
    classLabel: "Métal ductile",
    icon: "⚙️",
    E: 210000,
    Re: 250,
    Rm: 450,
    Ef: 0.22,
    defaultWidth: 10,
    defaultThickness: 2,
    defaultL0: 100
  },
  aluminum: {
    name: "Aluminium (6061)",
    classLabel: "Métal ductile",
    icon: "✈️",
    E: 70000,
    Re: 150,
    Rm: 240,
    Ef: 0.15,
    defaultWidth: 10,
    defaultThickness: 2,
    defaultL0: 100
  },
  plastic: {
    name: "Plastique (PVC)",
    classLabel: "Polymère",
    icon: "🥤",
    E: 2000,
    Re: 30,
    Rm: 55,
    Ef: 0.50,
    defaultWidth: 10,
    defaultThickness: 2,
    defaultL0: 100
  },
  concrete: {
    name: "Béton standard",
    classLabel: "Fragile",
    icon: "🧱",
    E: 30000,
    Re: null,
    Rm: 3.5,
    Ef: 0.000117,
    defaultWidth: 40,
    defaultThickness: 40,
    defaultL0: 160
  },
  concrete_lime: {
    name: "Béton + Chaux",
    classLabel: "Fragile",
    icon: "⏳",
    E: 15000,
    Re: null,
    Rm: 1.8,
    Ef: 0.00012,
    defaultWidth: 40,
    defaultThickness: 40,
    defaultL0: 160
  }
};

export default function MaterialForm({ material, setMaterial, isSimulationRunning }) {
  const handleSelectMaterial = (key) => {
    if (isSimulationRunning) return;
    const selected = MATERIALS_DB[key];
    setMaterial(prev => ({
      ...prev,
      key,
      name: selected.name,
      width: selected.defaultWidth,
      thickness: selected.defaultThickness,
      l0: selected.defaultL0,
      area: selected.defaultWidth * selected.defaultThickness,
      E: selected.E,
      Re: selected.Re,
      Rm: selected.Rm,
      Ef: selected.Ef
    }));
  };

  const handleChangeGeometry = (e) => {
    if (isSimulationRunning) return;
    const { name, value } = e.target;
    const valNum = parseFloat(value) || 0;
    
    setMaterial(prev => {
      const newWidth = name === 'width' ? valNum : prev.width;
      const newThickness = name === 'thickness' ? valNum : prev.thickness;
      return {
        ...prev,
        [name]: valNum,
        area: newWidth * newThickness
      };
    });
  };

  const handleChangeMetadata = (e) => {
    const { name, value } = e.target;
    setMaterial(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const activeMaterialInfo = MATERIALS_DB[material.key];

  return (
    <div className="card fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto', gap: '0.4rem' }}>
      <h2 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Box size={16} className="text-primary" /> Sélection & Paramètres
      </h2>
      
      {/* Material Selector Grid */}
      <div className="form-group no-print" style={{ marginBottom: '0.25rem' }}>
        <div className="material-selector-grid" style={{ gap: '0.4rem', marginBottom: 0 }}>
          {Object.keys(MATERIALS_DB).map((key) => {
            const mat = MATERIALS_DB[key];
            const isActive = material.key === key;
            return (
              <div
                key={key}
                className={`material-btn-card ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectMaterial(key)}
                style={{ 
                  opacity: isSimulationRunning ? 0.6 : 1, 
                  cursor: isSimulationRunning ? 'not-allowed' : 'pointer',
                  padding: '0.4rem 0.25rem',
                  borderRadius: '0.5rem',
                  gap: '0.2rem'
                }}
              >
                <span className="material-icon" style={{ fontSize: '1.1rem' }}>{mat.icon}</span>
                <span className="material-name" style={{ fontSize: '0.7rem' }}>{mat.name.split(" ")[0]}</span>
                <span className="material-class-badge" style={{ fontSize: '0.55rem', padding: '0.05rem 0.3rem' }}>
                  {mat.classLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tech Datasheet */}
      {activeMaterialInfo && (
        <div className="tech-spec-sheet fade-in" style={{ padding: '0.5rem 0.75rem', marginTop: 0, marginBottom: '0.25rem' }}>
          <div className="tech-spec-title" style={{ fontSize: '0.65rem', marginBottom: '0.35rem', paddingBottom: '0.15rem' }}>
            Fiche Technique Théorique
          </div>
          <div className="tech-spec-grid" style={{ gap: '0.4rem' }}>
            <div className="tech-spec-item">
              <span className="tech-spec-label" style={{ fontSize: '0.6rem' }}>Mod. Young (E)</span>
              <span className="tech-spec-value" style={{ color: 'var(--primary)', fontSize: '0.75rem' }}>
                {activeMaterialInfo.E.toLocaleString('fr-FR')} <small style={{ fontSize: '0.55rem' }}>MPa</small>
              </span>
            </div>
            <div className="tech-spec-item">
              <span className="tech-spec-label" style={{ fontSize: '0.6rem' }}>Résist. traction (R<sub>m</sub>)</span>
              <span className="tech-spec-value" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>
                {activeMaterialInfo.Rm.toLocaleString('fr-FR')} <small style={{ fontSize: '0.55rem' }}>MPa</small>
              </span>
            </div>
            <div className="tech-spec-item">
              <span className="tech-spec-label" style={{ fontSize: '0.6rem' }}>Limite Élastique (R<sub>e</sub>)</span>
              <span className="tech-spec-value" style={{ color: '#fbbf24', fontSize: '0.75rem' }}>
                {activeMaterialInfo.Re ? `${activeMaterialInfo.Re} MPa` : 'N/A (Fragile)'}
              </span>
            </div>
            <div className="tech-spec-item">
              <span className="tech-spec-label" style={{ fontSize: '0.6rem' }}>Déform. max (ε<sub>f</sub>)</span>
              <span className="tech-spec-value" style={{ color: 'var(--accent)', fontSize: '0.75rem' }}>
                {(activeMaterialInfo.Ef * 100).toFixed(activeMaterialInfo.Ef < 0.001 ? 3 : 1)} %
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Operator & Test ID Inputs */}
      <div className="input-row" style={{ marginTop: 0, marginBottom: 0, gap: '0.4rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.7rem', marginBottom: '0.15rem' }}>Opérateur</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              name="operator" 
              value={material.operator} 
              onChange={handleChangeMetadata} 
              placeholder="Expert"
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderRadius: '0.5rem' }}
            />
            <User size={12} className="no-print" style={{ position: 'absolute', right: '8px', top: '9px', color: 'var(--text-muted)' }} />
          </div>
          <div className="print-only" style={{ fontWeight: 'bold' }}>{material.operator || 'N/A'}</div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.7rem', marginBottom: '0.15rem' }}>ID Essai</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              name="testId" 
              value={material.testId} 
              onChange={handleChangeMetadata} 
              disabled={isSimulationRunning}
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderRadius: '0.5rem' }}
            />
            <FileText size={12} className="no-print" style={{ position: 'absolute', right: '8px', top: '9px', color: 'var(--text-muted)' }} />
          </div>
          <div className="print-only">{material.testId}</div>
        </div>
      </div>
      
      {/* Geometry Inputs (3 Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginTop: 0 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.7rem', marginBottom: '0.15rem' }}>Largeur (mm)</label>
          <input 
            type="number" 
            name="width" 
            value={material.width} 
            onChange={handleChangeGeometry} 
            disabled={isSimulationRunning}
            placeholder="0.0"
            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderRadius: '0.5rem' }}
          />
          <div className="print-only">{material.width} mm</div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.7rem', marginBottom: '0.15rem' }}>Épaiss. (mm)</label>
          <input 
            type="number" 
            name="thickness" 
            value={material.thickness} 
            onChange={handleChangeGeometry} 
            disabled={isSimulationRunning}
            placeholder="0.0"
            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderRadius: '0.5rem' }}
          />
          <div className="print-only">{material.thickness} mm</div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.7rem', marginBottom: '0.15rem' }}>L₀ (mm)</label>
          <input 
            type="number" 
            name="l0" 
            value={material.l0} 
            onChange={handleChangeGeometry} 
            disabled={isSimulationRunning}
            placeholder="100.0"
            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderRadius: '0.5rem' }}
          />
          <div className="print-only">{material.l0} mm</div>
        </div>
      </div>

      <div className="stat-grid" style={{ marginTop: 'auto', marginBottom: 0, paddingTop: '0.25rem' }}>
        <div className="stat-card" style={{ padding: '0.4rem 0.5rem', borderRadius: '0.5rem' }}>
          <div className="stat-label" style={{ fontSize: '0.6rem' }}>Section Transversale A₀</div>
          <div className="stat-value" style={{ fontSize: '0.9rem' }}>{material.area.toFixed(1)} <small style={{ fontSize: '0.65rem' }}>mm²</small></div>
        </div>
      </div>
    </div>
  );
}
