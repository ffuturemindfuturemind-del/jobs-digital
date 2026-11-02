import React, { useState } from 'react';
import { Eye, Clock, Activity, ChevronUp, ChevronDown, Sparkles, Layers } from 'lucide-react';

interface ControlDock4DProps {
  modoVisual: 'holograma' | 'matriz' | 'cyber';
  setModoVisual: (m: 'holograma' | 'matriz' | 'cyber') => void;
  velocidadeTempo: number;
  setVelocidadeTempo: (v: number) => void;
}

export const ControlDock4D: React.FC<ControlDock4DProps> = ({
  modoVisual,
  setModoVisual,
  velocidadeTempo,
  setVelocidadeTempo,
}) => {
  const [colapsado, setColapsado] = useState(true);

  return (
    <aside
      aria-label="Controles de Renderização 4D"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 pointer-events-auto"
    >
      <div className="bg-slate-900/90 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-2.5 shadow-2xl shadow-orange-500/15 max-w-sm sm:max-w-md mx-auto text-xs">
        {/* Toggle Button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping"></span>
            <span className="font-extrabold tracking-wider uppercase text-[10px] text-orange-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Interface 4D Espacial Ativa
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-400 font-mono hidden sm:inline">
              10 Nós Quânticos Online
            </span>
            <button
              onClick={() => setColapsado(!colapsado)}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title={colapsado ? 'Expandir Ajustes 4D' : 'Recolher Ajustes 4D'}
            >
              {colapsado ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Drawer de Ajustes Expandido */}
        {!colapsado && (
          <div className="pt-3 mt-2 border-t border-slate-800 space-y-3">
            {/* Seletor de Modo 4D */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                <Layers className="w-3 h-3 text-purple-400" />
                Matriz Visual 4D:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setModoVisual('matriz')}
                  className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all ${
                    modoVisual === 'matriz'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  Matriz Quântica
                </button>
                <button
                  onClick={() => setModoVisual('cyber')}
                  className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all ${
                    modoVisual === 'cyber'
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/40'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  Cyber Neon
                </button>
                <button
                  onClick={() => setModoVisual('holograma')}
                  className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all ${
                    modoVisual === 'holograma'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/40'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  Holograma
                </button>
              </div>
            </div>

            {/* Velocidade Temporal da 4ª Dimensão */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                Frequência Temporal (4ª Dimensão):
              </span>
              <div className="flex items-center gap-2">
                {[0.5, 1.0, 2.0].map((v) => (
                  <button
                    key={v}
                    onClick={() => setVelocidadeTempo(v)}
                    className={`flex-1 py-1 rounded-xl text-[10px] font-bold font-mono transition-all ${
                      velocidadeTempo === v
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {v}x {v === 0.5 ? 'Zen' : v === 1 ? 'Real' : 'Warp'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
