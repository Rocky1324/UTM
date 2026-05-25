import React, { useState, useEffect, useRef } from 'react';
import MaterialForm, { MATERIALS_DB } from './components/MaterialForm';
import TensileVisualizer from './components/TensileVisualizer';
import StressStrainChart from './components/StressStrainChart';
import DataEntry from './components/DataEntry';
import { Microscope, Download, FileText, Play, Zap, RotateCcw } from 'lucide-react';

function App() {
  const initialMaterialKey = 'steel';
  const defaultSteel = MATERIALS_DB[initialMaterialKey];

  const [material, setMaterial] = useState({
    key: initialMaterialKey,
    name: defaultSteel.name,
    width: defaultSteel.defaultWidth,
    thickness: defaultSteel.defaultThickness,
    l0: defaultSteel.defaultL0,
    area: defaultSteel.defaultWidth * defaultSteel.defaultThickness,
    E: defaultSteel.E,
    Re: defaultSteel.Re,
    Rm: defaultSteel.Rm,
    Ef: defaultSteel.Ef,
    operator: '',
    testId: `TEST-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.floor(Math.random()*1000)}`
  });

  const [data, setData] = useState([]);
  const [status, setStatus] = useState('ready'); // 'ready' | 'testing' | 'plastic' | 'necking' | 'ruptured'
  const [progress, setProgress] = useState(0); // 0 to 1
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Scientific stress-strain relation formulas
  const getStressForStrain = (eps, mat) => {
    const { E, Re, Rm, Ef } = mat;
    
    // 1. Concrete (brittle materials)
    if (mat.key === 'concrete' || mat.key === 'concrete_lime') {
      if (eps > Ef) return 0;
      return E * eps;
    }

    // 2. Steel (with yield limit, plateau, hardening, and necking)
    if (mat.key === 'steel') {
      const epsE = Re / E; // yield limit strain (~0.00119)
      const epsSH = 0.015; // strain hardening start
      const epsU = 0.12;  // ultimate strain (peak UTS)
      const sigmaF = 370; // stress at break (MPa)

      if (eps <= epsE) {
        return E * eps;
      } else if (eps <= epsSH) {
        // Yield plateau with minor Lüders oscillation
        const oscillation = 3 * Math.sin(2 * Math.PI * (eps - epsE) / 0.003);
        return Re + oscillation;
      } else if (eps <= epsU) {
        // Strain hardening
        return Re + (Rm - Re) * (1 - Math.pow((epsU - eps) / (epsU - epsSH), 2));
      } else if (eps <= Ef) {
        // Necking post-peak
        return Rm - (Rm - sigmaF) * Math.pow((eps - epsU) / (Ef - epsU), 2);
      } else {
        return 0; // Ruptured
      }
    }

    // 3. Aluminum (smooth transition, no plateau)
    if (mat.key === 'aluminum') {
      const epsE = Re / E; // yield limit strain (~0.00214)
      const epsU = 0.08;  // ultimate strain
      const sigmaF = 210; // stress at break

      if (eps <= epsE) {
        return E * eps;
      } else if (eps <= epsU) {
        // Smooth transition
        return Re + (Rm - Re) * Math.sin((Math.PI / 2) * (eps - epsE) / (epsU - epsE));
      } else if (eps <= Ef) {
        // Necking
        return Rm - (Rm - sigmaF) * Math.pow((eps - epsU) / (Ef - epsU), 2);
      } else {
        return 0;
      }
    }

    // 4. Plastic (PVC - highly ductile, long plateau/stretch)
    if (mat.key === 'plastic') {
      const epsE = Re / E; // yield limit (~0.015)
      const epsU = 0.25;  // ultimate strain
      const sigmaF = 40;  // stress at break

      if (eps <= epsE) {
        return E * eps;
      } else if (eps <= epsU) {
        return Re + (Rm - Re) * Math.sin((Math.PI / 2) * (eps - epsE) / (epsU - epsE));
      } else if (eps <= Ef) {
        // Ductile stretch (linear stress drop)
        return Rm - (Rm - sigmaF) * ((eps - epsU) / (Ef - epsU));
      } else {
        return 0;
      }
    }

    return 0;
  };

  const startSimulation = () => {
    if (isSimulationRunning) return;

    // Reset previous run
    setData([]);
    setStatus('ready');
    setProgress(0);
    setIsSimulationRunning(true);

    const totalSteps = 100;
    let step = 0;

    const intervalId = setInterval(() => {
      step++;
      const progressVal = step / totalSteps;
      setProgress(progressVal);

      // Current physical values
      const eps = progressVal * material.Ef;
      const stress = getStressForStrain(eps, material);
      const force = stress * material.area; // F = σ * A₀
      const deltaL = eps * material.l0;   // ΔL = ε * L₀

      const newPoint = {
        id: step,
        force,
        deltaL,
        stress,
        strain: eps
      };

      setData(prev => [...prev, newPoint]);

      // Calculate status based on current strain
      const epsE = material.Re ? material.Re / material.E : material.Ef;
      const epsU = material.key === 'steel' ? 0.12 : material.key === 'aluminum' ? 0.08 : material.key === 'plastic' ? 0.25 : material.Ef;

      if (step >= totalSteps) {
        clearInterval(intervalId);
        setStatus('ruptured');
        setIsSimulationRunning(false);
      } else if (eps > epsU) {
        setStatus('necking');
      } else if (eps > epsE) {
        setStatus('plastic');
      } else {
        setStatus('testing');
      }
    }, 60); // 100 steps * 60ms = 6s duration

    timerRef.current = intervalId;
  };

  const induceRupture = () => {
    if (!isSimulationRunning && status === 'ruptured') return;

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Instantly fill remaining points up to rupture
    const totalSteps = 100;
    const currentLength = data.length;
    const newPoints = [];

    for (let step = currentLength + 1; step <= totalSteps; step++) {
      const progressVal = step / totalSteps;
      const eps = progressVal * material.Ef;
      const stress = getStressForStrain(eps, material);
      const force = stress * material.area;
      const deltaL = eps * material.l0;

      newPoints.push({
        id: step,
        force,
        deltaL,
        stress,
        strain: eps
      });
    }

    setData(prev => [...prev, ...newPoints]);
    setProgress(1);
    setStatus('ruptured');
    setIsSimulationRunning(false);
  };

  const resetSimulation = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setData([]);
    setProgress(0);
    setStatus('ready');
    setIsSimulationRunning(false);
  };

  const exportCSV = () => {
    if (data.length === 0) return;
    const headers = ["Force (N)", "Allongement (mm)", "Contrainte (MPa)", "Deformation (mm/mm)"];
    const rows = data.map(p => [p.force.toFixed(2), p.deltaL.toFixed(4), p.stress.toFixed(4), p.strain.toFixed(6)]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rapport_test_${material.key}_${material.testId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    if (data.length === 0) return;
    const exportData = {
      material,
      testResults: data,
      exportedAt: new Date().toISOString(),
      summary: {
        maxStressMPa: Math.max(...data.map(p => p.stress)).toFixed(2),
        maxForceN: Math.max(...data.map(p => p.force)).toFixed(2),
        maxStrainPercent: (Math.max(...data.map(p => p.strain)) * 100).toFixed(4),
        maxElongationMM: Math.max(...data.map(p => p.deltaL)).toFixed(4),
        status
      }
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `rapport_test_${material.key}_${material.testId}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activePoint = data.length > 0 ? data[data.length - 1] : { force: 0, deltaL: 0, stress: 0, strain: 0 };

  return (
    <div className="container">
      <header className="fade-in no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
          <Microscope size={36} style={{ color: 'var(--primary)' }} />
          <div>
            <h1 style={{ fontSize: '1.4rem', margin: 0, lineHeight: 1.2, fontWeight: 800, background: 'linear-gradient(to right, #818cf8, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Simulateur de Résistance des Matériaux
            </h1>
            <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-muted)' }}>Banc d'essai virtuel de traction mécanique en temps réel</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="export-group" style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-secondary" 
              style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem', borderRadius: '0.5rem' }} 
              onClick={exportCSV} 
              title="Télécharger CSV"
              disabled={data.length === 0}
            >
              <Download size={14} /> CSV
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem', borderRadius: '0.5rem' }} 
              onClick={exportJSON} 
              title="Télécharger JSON"
              disabled={data.length === 0}
            >
              <FileText size={14} /> JSON
            </button>
          </div>
          <button 
            className="btn" 
            style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem', borderRadius: '0.5rem' }} 
            onClick={() => window.print()}
            disabled={data.length === 0}
          >
            <FileText size={14} /> Exporter Rapport PDF
          </button>
        </div>
      </header>

      {/* Print-only Header */}
      <header className="print-only" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1>Simulateur de Résistance des Matériaux</h1>
        <p>Banc d'essai virtuel de traction mécanique en temps réel</p>
      </header>

      <main className="dashboard-container">
        {/* Colonne 1 : Sélection & Paramètres */}
        <MaterialForm 
          material={material} 
          setMaterial={setMaterial} 
          isSimulationRunning={isSimulationRunning} 
        />
        
        {/* Colonne 2 : Machine de Traction Virtuelle (haut) & Journal d'Essai (bas) */}
        <div className="middle-column">
          <div className="card fade-in" style={{ animationDelay: '0.1s', flexShrink: 0 }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              <Microscope size={18} style={{ color: 'var(--primary)' }} /> Machine de Traction
            </h2>
            
            <TensileVisualizer 
              material={material} 
              currentPoint={activePoint} 
              status={status} 
              progress={progress} 
              materialKey={material.key}
            />

            <div className="sim-controls no-print">
              <button 
                className="btn btn-start" 
                onClick={startSimulation} 
                disabled={isSimulationRunning}
                style={{ padding: '0.5rem 0.25rem', fontSize: '0.75rem', borderRadius: '0.5rem' }}
              >
                <Play size={14} /> Démarrer
              </button>
              <button 
                className="btn btn-break" 
                onClick={induceRupture} 
                disabled={!isSimulationRunning && status === 'ruptured'}
                style={{ padding: '0.5rem 0.25rem', fontSize: '0.75rem', borderRadius: '0.5rem' }}
              >
                <Zap size={14} /> Rupture
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={resetSimulation}
                style={{ padding: '0.5rem 0.25rem', fontSize: '0.75rem', borderRadius: '0.5rem' }}
              >
                <RotateCcw size={14} /> Reset
              </button>
            </div>
          </div>

          <DataEntry 
            data={data} 
            material={material} 
          />
        </div>

        {/* Colonne 3 : Graphique Contrainte-Déformation */}
        <StressStrainChart 
          data={data} 
          material={material} 
          status={status} 
        />
      </main>

      <footer style={{ marginTop: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', paddingBottom: '0.5rem' }}>
        <div className="print-only signature-area">
          <div>Signature de l'Expert : _________________</div>
          <div>Date : {new Date().toLocaleDateString('fr-FR')}</div>
        </div>
        <p>© 2026 Laboratoire de Résistance des Matériaux - Simulateur Physique Universel</p>
        <p style={{ marginTop: '0.2rem' }}>
          Formules : σ = F / A₀ (Contrainte nominale) | ε = ΔL / L₀ (Déformation nominale)
        </p>
      </footer>
    </div>
  );
}

export default App;
