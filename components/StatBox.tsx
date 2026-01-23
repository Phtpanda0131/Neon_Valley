
import React from 'react';

interface Props {
  label: string;
  value: number;
  description: string;
  onChange: (val: number) => void;
  canIncrease: boolean;
  externalModifier?: number;
}

const StatBox: React.FC<Props> = ({ label, value, description, onChange, canIncrease, externalModifier = 0 }) => {
  const baseModifier = Math.floor((value - 4) / 2);
  const totalModifier = baseModifier + externalModifier;
  const modSign = totalModifier >= 0 ? '+' : '';
  const isMax = value >= 10;
  const isMin = value <= 1;

  return (
    <div className="relative group bg-slate-950/40 border border-slate-800 hover:border-cyan-500/50 transition-all duration-500 flex flex-col h-full clip-path-cyber overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:10px_10px]" />
      
      {/* Top Header Label */}
      <div className="bg-slate-900/80 border-b border-slate-800 px-3 py-1.5 flex justify-between items-center relative overflow-hidden">
        <span className="text-[10px] font-orbitron font-black text-cyan-500 uppercase tracking-widest z-10">{label}</span>
        <span className="text-[8px] font-mono text-slate-600 uppercase z-10">CORE_V4</span>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-cyan-500/20 group-hover:bg-cyan-500 animate-pulse" />
      </div>

      <div className="flex flex-1 p-3 gap-3">
        {/* Main Display Area */}
        <div className="flex-1 flex flex-col justify-center items-center relative bg-black/20 border border-slate-800/50 rounded-sm">
          <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-cyan-500/30" />
          <span className={`text-4xl md:text-5xl font-orbitron font-black tabular-nums transition-all ${isMax ? 'text-cyan-400 neon-text-cyan' : 'text-white'}`}>
            {value.toString().padStart(2, '0')}
          </span>
          <div className={`mt-1 px-2 py-0.5 text-[10px] font-mono font-bold uppercase transition-all ${totalModifier >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
             STABILITY: {modSign}{totalModifier}
          </div>
        </div>

        {/* Tactical Controls Side-rail */}
        <div className="flex flex-col gap-1 w-10">
          <button 
            onClick={() => !isMax && canIncrease && onChange(value + 1)}
            disabled={isMax || !canIncrease}
            className={`flex-1 flex items-center justify-center border transition-all ${
              isMax || !canIncrease 
                ? 'border-slate-800 text-slate-600 cursor-not-allowed bg-slate-900/50' 
                : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:border-cyan-300 shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]'
            }`}
            title={!canIncrease ? "Neural Pool Empty" : "Increase Stat"}
          >
            <span className="text-xl font-bold">+</span>
          </button>
          
          <button 
            onClick={() => !isMin && onChange(value - 1)}
            disabled={isMin}
            className={`flex-1 flex items-center justify-center border transition-all ${
              isMin 
                ? 'border-slate-800 text-slate-600 cursor-not-allowed bg-slate-900/50' 
                : 'border-slate-700 text-slate-400 hover:bg-rose-600 hover:text-white hover:border-rose-400'
            }`}
            title="Decrease Stat"
          >
            <span className="text-xl font-bold">-</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-3 pb-3">
        {/* Progress Matrix */}
        <div className="flex gap-0.5 mb-2 h-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 transition-all duration-500 ${i < value ? 'bg-cyan-500 shadow-[0_0_5px_#06b6d4]' : 'bg-slate-800'}`}
            />
          ))}
        </div>
        <div className="flex justify-between items-center mb-1">
           <p className="text-[9px] font-mono text-slate-500 leading-tight uppercase group-hover:text-slate-300 transition-colors h-8 overflow-hidden flex-1">
            {description}
          </p>
          {externalModifier !== 0 && (
            <span className={`text-[8px] font-mono font-bold px-1 ${externalModifier > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              LINK_MOD: {externalModifier > 0 ? '+' : ''}{externalModifier}
            </span>
          )}
        </div>
      </div>

      {/* Corner Accent */}
      <div className="absolute bottom-0 right-0 w-4 h-4 bg-slate-800/50 clip-path-cyber flex items-center justify-center pointer-events-none">
        <div className="w-1 h-1 bg-cyan-500/40 rounded-full" />
      </div>
    </div>
  );
};

export default StatBox;
