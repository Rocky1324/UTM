import React from 'react';

export default function TensileVisualizer({ 
  material, 
  currentPoint, 
  status, 
  progress, 
  materialKey 
}) {
  // Config parameters for visual scaling based on material
  const getVisualParams = () => {
    switch (materialKey) {
      case 'steel':
        return { maxStretch: 35, maxNecking: 0.35, isBrittle: false, crackType: 'cup-cone' };
      case 'aluminum':
        return { maxStretch: 25, maxNecking: 0.25, isBrittle: false, crackType: 'cup-cone' };
      case 'plastic':
        return { maxStretch: 55, maxNecking: 0.45, isBrittle: false, crackType: 'shear' };
      case 'concrete':
      case 'concrete_lime':
      default:
        return { maxStretch: 1, maxNecking: 0, isBrittle: true, crackType: 'flat' };
    }
  };

  const { maxStretch, maxNecking, isBrittle, crackType } = getVisualParams();

  // Current values
  const stress = currentPoint ? currentPoint.stress : 0;
  const strain = currentPoint ? currentPoint.strain : 0;
  const force = currentPoint ? currentPoint.force : 0;
  const deltaL = currentPoint ? currentPoint.deltaL : 0;

  // Visual displacement in pixels
  // We scale progress (from 0 to 1) linearly with the material's visual stretch
  const visualDeltaL = progress * maxStretch;

  // Geometry coordinates
  const widthGrip = 24; // Width of the gripped ends (px)
  const widthGauge0 = 12; // Initial width of the gauge section (px)
  
  // Coordinate boundaries
  const yBottomGrip = 280; // Bottom grip position (fixed)
  const yTopGrip0 = 120; // Initial top grip position
  const yTopGrip = yTopGrip0 - visualDeltaL; // Current top grip position (moving up)

  // Anchor points for shoulders
  const yTs = yTopGrip + 20; // Top shoulder
  const yBs = yBottomGrip - 20; // Bottom shoulder
  const yMid = (yTs + yBs) / 2; // Middle of specimen

  // Calculate local necking and Poisson's ratio thinning
  const nu = 0.3; // Poisson's ratio for visual thinning
  const elasticStrainLimit = material.Re ? material.Re / material.E : 0.002;
  
  let currentNecking = 0;
  if (!isBrittle && currentPoint) {
    if (strain > elasticStrainLimit) {
      // Plastic range necking starts growing
      const plasticProgress = (strain - elasticStrainLimit) / (material.Ef - elasticStrainLimit);
      currentNecking = Math.max(0, Math.min(1, plasticProgress)) * maxNecking;
    }
  }

  // Width in the middle vs ends of gauge section
  const wGaugeEnd = widthGauge0 * (1 - nu * Math.min(0.2, strain));
  const wMid = wGaugeEnd * (1 - currentNecking);

  // Heat map color interpolation for the center stress concentration
  // We map the stress ratio (stress / Rm) to a warm color scale
  const getStressColor = (localStress) => {
    const Rm = material.Rm || 10;
    const ratio = Math.min(1.1, localStress / Rm);
    
    if (status === 'ruptured') {
      return '#475569'; // Cool back down immediately upon rupture
    }

    if (ratio < 0.2) {
      return '#64748b'; // Cold slate blue
    } else if (ratio < 0.6) {
      // Interpolate Slate Blue (#64748b) -> Orange (#f97316)
      const r = 100 + (249 - 100) * ((ratio - 0.2) / 0.4);
      const g = 116 + (115 - 116) * ((ratio - 0.2) / 0.4);
      const b = 139 + (22 - 139) * ((ratio - 0.2) / 0.4);
      return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    } else {
      // Interpolate Orange (#f97316) -> Glowing Yellow/Red (#ef4444)
      const r = 249 + (239 - 249) * ((ratio - 0.6) / 0.5);
      const g = 115 + (68 - 115) * ((ratio - 0.6) / 0.5);
      const b = 22 + (68 - 22) * ((ratio - 0.6) / 0.5);
      return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }
  };

  const centerColor = getStressColor(stress);
  const gripColor = getStressColor(stress * 0.15); // Stress in grip is much lower due to larger area

  // SVG spec path rendering
  const renderSpecimen = () => {
    if (status === 'ruptured') {
      // Render two separated broken pieces
      const gap = 6; // Pixels gap after break
      const crackOffset = crackType === 'flat' ? 0 : crackType === 'shear' ? 3 : 2;
      
      // Top Piece Path
      const topPiecePath = `
        M ${120 - widthGrip/2} ${yTopGrip}
        L ${120 - widthGrip/2} ${yTs - 5}
        Q ${120 - widthGrip/2} ${yTs} ${120 - wGaugeEnd/2} ${yTs + 5}
        L ${120 - wMid/2} ${yMid - gap/2}
        L ${120 - wMid/2 + (crackType === 'cup-cone' ? wMid*0.2 : 0)} ${yMid - gap/2 + crackOffset}
        L ${120 + wMid/2 - (crackType === 'cup-cone' ? wMid*0.2 : 0)} ${yMid - gap/2 - crackOffset}
        L ${120 + wMid/2} ${yMid - gap/2}
        L ${120 + wGaugeEnd/2} ${yTs + 5}
        Q ${120 + widthGrip/2} ${yTs} ${120 + widthGrip/2} ${yTs - 5}
        L ${120 + widthGrip/2} ${yTopGrip}
        Z
      `;

      // Bottom Piece Path
      const bottomPiecePath = `
        M ${120 - widthGrip/2} ${yBottomGrip}
        L ${120 - widthGrip/2} ${yBs + 5}
        Q ${120 - widthGrip/2} ${yBs} ${120 - wGaugeEnd/2} ${yBs - 5}
        L ${120 - wMid/2} ${yMid + gap/2}
        L ${120 - wMid/2 + (crackType === 'cup-cone' ? wMid*0.2 : 0)} ${yMid + gap/2 + crackOffset}
        L ${120 + wMid/2 - (crackType === 'cup-cone' ? wMid*0.2 : 0)} ${yMid + gap/2 - crackOffset}
        L ${120 + wMid/2} ${yMid + gap/2}
        L ${120 + wGaugeEnd/2} ${yBs - 5}
        Q ${120 + widthGrip/2} ${yBs} ${120 + widthGrip/2} ${yBs + 5}
        L ${120 + widthGrip/2} ${yBottomGrip}
        Z
      `;

      return (
        <g>
          {/* Top Piece */}
          <path d={topPiecePath} fill="url(#specimenGradTop)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" filter="url(#glow-rupture)" />
          {/* Bottom Piece */}
          <path d={bottomPiecePath} fill="url(#specimenGradBottom)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" filter="url(#glow-rupture)" />
          {/* Visual Crack effect */}
          <line x1={120 - wMid/2} y1={yMid - gap/2} x2={120 + wMid/2} y2={yMid - gap/2 + (crackType === 'shear' ? crackOffset*2 : 0)} stroke="#ef4444" strokeWidth="1" strokeDasharray="1 1" />
          <line x1={120 - wMid/2} y1={yMid + gap/2} x2={120 + wMid/2} y2={yMid + gap/2 + (crackType === 'shear' ? crackOffset*2 : 0)} stroke="#ef4444" strokeWidth="1" strokeDasharray="1 1" />
        </g>
      );
    }

    // Continuous Specimen Path
    // Using bezier curve Q from shoulder to center to create smooth necking profile
    const specimenPath = `
      M ${120 - widthGrip/2} ${yTopGrip}
      L ${120 - widthGrip/2} ${yTs - 5}
      Q ${120 - widthGrip/2} ${yTs} ${120 - wGaugeEnd/2} ${yTs + 5}
      Q ${120 - wMid/2} ${yMid} ${120 - wGaugeEnd/2} ${yBs - 5}
      Q ${120 - widthGrip/2} ${yBs} ${120 - widthGrip/2} ${yBs + 5}
      L ${120 - widthGrip/2} ${yBottomGrip}
      L ${120 + widthGrip/2} ${yBottomGrip}
      L ${120 + widthGrip/2} ${yBs + 5}
      Q ${120 + widthGrip/2} ${yBs} ${120 + wGaugeEnd/2} ${yBs - 5}
      Q ${120 + wMid/2} ${yMid} ${120 + wGaugeEnd/2} ${yTs + 5}
      Q ${120 + widthGrip/2} ${yTs} ${120 + widthGrip/2} ${yTs - 5}
      L ${120 + widthGrip/2} ${yTopGrip}
      Z
    `;

    return (
      <path 
        d={specimenPath} 
        fill="url(#specimenGrad)" 
        stroke="rgba(255, 255, 255, 0.1)" 
        strokeWidth="1" 
      />
    );
  };

  // Crosshead and screw visual position
  const yCrosshead = 85 - visualDeltaL;

  return (
    <div className="machine-visualizer-card">
      <div className="status-indicator-wrapper">
        {status === 'ready' && (
          <div className="status-indicator status-ready">
            <span className="status-dot"></span> Prêt
          </div>
        )}
        {status === 'testing' && (
          <div className="status-indicator status-testing">
            <span className="status-dot"></span> Élastique
          </div>
        )}
        {status === 'plastic' && (
          <div className="status-indicator status-plastic">
            <span className="status-dot"></span> Plastification
          </div>
        )}
        {status === 'necking' && (
          <div className="status-indicator status-necking">
            <span className="status-dot"></span> Striction
          </div>
        )}
        {status === 'ruptured' && (
          <div className="status-indicator status-ruptured">
            <span className="status-dot"></span> Rupture !
          </div>
        )}
      </div>

      <div className="machine-svg-container">
        <svg width="100%" height="100%" viewBox="0 0 240 380">
          <defs>
            {/* Screw thread pattern for guide columns */}
            <pattern id="column-thread" width="10" height="6" patternUnits="userSpaceOnUse">
              <line x1="0" y1="1" x2="10" y2="3" stroke="#1e293b" strokeWidth="1.5" />
              <line x1="0" y1="4" x2="10" y2="6" stroke="#475569" strokeWidth="1.5" />
              <rect width="10" height="6" fill="rgba(255,255,255,0.05)" />
            </pattern>

            {/* Glowing filter for high-stress zones */}
            <filter id="glow-rupture" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Specimen Gradient (Continuous) */}
            <linearGradient id="specimenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={gripColor} />
              <stop offset="25%" stopColor={gripColor} />
              <stop offset="40%" stopColor={centerColor} />
              <stop offset="50%" stopColor={centerColor} />
              <stop offset="60%" stopColor={centerColor} />
              <stop offset="75%" stopColor={gripColor} />
              <stop offset="100%" stopColor={gripColor} />
            </linearGradient>

            {/* Specimen Gradient Top (Ruptured) */}
            <linearGradient id="specimenGradTop" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="60%" stopColor="#475569" />
              <stop offset="90%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            {/* Specimen Gradient Bottom (Ruptured) */}
            <linearGradient id="specimenGradBottom" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="10%" stopColor="#64748b" />
              <stop offset="40%" stopColor="#475569" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>

          {/* Machine Grid Background */}
          <g stroke="rgba(255,255,255,0.02)" strokeWidth="0.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 20} y1="0" x2={i * 20} y2="380" />
            ))}
            {Array.from({ length: 19 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 20} x2={240} y2={i * 20} />
            ))}
          </g>

          {/* Scale Markings (Ruler in background) */}
          <g fill="rgba(148, 163, 184, 0.2)" fontSize="8" fontFamily="sans-serif">
            {Array.from({ length: 11 }).map((_, i) => {
              const y = 100 + i * 20;
              return (
                <g key={`scale-${i}`}>
                  <line x1="20" y1={y} x2="28" y2={y} stroke="rgba(148,163,184,0.3)" strokeWidth="1" />
                  <text x="8" y={y + 3} textAnchor="start">{i * 10} mm</text>
                </g>
              );
            })}
          </g>

          {/* Guide Columns (Left and Right Shafts) */}
          {/* Left Column */}
          <rect x="35" y="40" width="12" height="300" rx="2" fill="#334155" />
          <rect x="35" y="40" width="12" height="300" rx="2" fill="url(#column-thread)" />
          <rect x="35" y="40" width="3" height="300" fill="rgba(255,255,255,0.15)" />
          
          {/* Right Column */}
          <rect x="193" y="40" width="12" height="300" rx="2" fill="#334155" />
          <rect x="193" y="40" width="12" height="300" rx="2" fill="url(#column-thread)" />
          <rect x="193" y="40" width="3" height="300" fill="rgba(255,255,255,0.15)" />

          {/* Fixed Base Plate (Lower Support) */}
          <rect x="20" y="310" width="200" height="25" rx="3" fill="linear-gradient(#475569, #1e293b)" stroke="#475569" strokeWidth="1.5" />
          <rect x="20" y="310" width="200" height="3" fill="rgba(255,255,255,0.2)" />
          
          {/* Moving Crosshead (Upper Support) */}
          <g>
            {/* Crosshead body */}
            <rect x="20" y={yCrosshead} width="200" height="25" rx="3" fill="#334155" stroke="#475569" strokeWidth="1.5" />
            {/* Highlight line on top */}
            <rect x="20" y={yCrosshead} width="200" height="3" fill="rgba(255,255,255,0.25)" />
            {/* Guide shaft holes */}
            <rect x="33" y={yCrosshead - 1} width="16" height="27" rx="1" fill="none" stroke="#64748b" strokeWidth="1" />
            <rect x="191" y={yCrosshead - 1} width="16" height="27" rx="1" fill="none" stroke="#64748b" strokeWidth="1" />
          </g>

          {/* Bottom Grip (Fixed) */}
          <rect x="100" y="275" width="40" height="35" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          {/* Teeth pattern inside bottom grip */}
          <line x1="105" y1="280" x2="135" y2="280" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1="105" y1="285" x2="135" y2="285" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1="105" y1="290" x2="135" y2="290" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1="105" y1="295" x2="135" y2="295" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

          {/* Top Grip (Attached to Moving Crosshead) */}
          <rect x="100" y={yCrosshead + 25} width="40" height="35" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          {/* Teeth pattern inside top grip */}
          <line x1="105" y1={yCrosshead + 30} x2="135" y2={yCrosshead + 30} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1="105" y1={yCrosshead + 35} x2="135" y2={yCrosshead + 35} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1="105" y1={yCrosshead + 40} x2="135" y2={yCrosshead + 40} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1="105" y1={yCrosshead + 45} x2="135" y2={yCrosshead + 45} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

          {/* SPECIMEN */}
          {renderSpecimen()}

          {/* Grip Overlay Bolts */}
          <circle cx="110" cy="292" r="3" fill="#475569" stroke="#1e293b" strokeWidth="1" />
          <circle cx="130" cy="292" r="3" fill="#475569" stroke="#1e293b" strokeWidth="1" />
          <circle cx="110" cy={yCrosshead + 42} r="3" fill="#475569" stroke="#1e293b" strokeWidth="1" />
          <circle cx="130" cy={yCrosshead + 42} r="3" fill="#475569" stroke="#1e293b" strokeWidth="1" />
        </svg>
      </div>

      {/* Mini live gauges */}
      <div className="telemetry-row">
        <div className="telemetry-card">
          <div className="telemetry-label">Force F</div>
          <div className="telemetry-value" style={{ color: 'var(--primary)' }}>
            {(force / 1000).toFixed(2)}
            <span className="telemetry-unit">kN</span>
          </div>
        </div>
        <div className="telemetry-card">
          <div className="telemetry-label">Allong. ΔL</div>
          <div className="telemetry-value" style={{ color: 'var(--accent)' }}>
            {deltaL.toFixed(3)}
            <span className="telemetry-unit">mm</span>
          </div>
        </div>
        <div className="telemetry-card">
          <div className="telemetry-label">Contrainte σ</div>
          <div className="telemetry-value" style={{ color: '#fbbf24' }}>
            {stress.toFixed(1)}
            <span className="telemetry-unit">MPa</span>
          </div>
        </div>
        <div className="telemetry-card">
          <div className="telemetry-label">Déform. ε</div>
          <div className="telemetry-value" style={{ color: '#f87171' }}>
            {(strain * 100).toFixed(3)}
            <span className="telemetry-unit">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
