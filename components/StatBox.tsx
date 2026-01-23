
import React from 'react';

interface Props {
  label: string;
  value: number;
  description: string;
  onChange: (val: number) => void;
  canIncrease: boolean;
}

const StatBox: React.FC<Props> = ({ label, value, description, onChange, canIncrease }) => {
  const modifier = Math.floor((value - 4) / 2);
  const modSign = modifier >= 0 ? '+' : '';

  return (
    <div className="cyber-card bg-slate-900/40 p-3 md:p-4 flex flex-col items-center group hover:bg-slate-900/60 transition-all duration-300 relative overflow-hidden h-full">
      {/* Background Decor */}
      <div className="absolute top-2 left-2 text-[6px] font-mono text-cyan-500/20 uppercase select-none pointer-events-none">BIOMETRIC_SENSOR_v4</div>
      <div className="absolute bottom-2 right-2 flex gap-1 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
        <div className="w-1 h-3 bg-cyan-500" />
        <div className="w-1 h-2 bg-cyan-500 mt-auto" />
      </div>

      <span className="text-[10px] md:text-xs uppercase font-orbitron text-cyan-500/60 group-hover:text-cyan-400 transition-colors tracking-[0.2em] w-full text-center font-bold">
        {label}
      </span>
      
      <div className="flex items-center gap-2 md:gap-4 my-3 md:my-5 w-full justify-between">
        <button 
          onClick={() => onChange(Math.max(1, value - 1))}
          className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center border transition-all shrink-0 font-black ${
            value > 1 ? 'border-cyan-500/30 text-cyan-500 hover:bg-cyan-500 hover:text-black hover:border-cyan-300' : 'border-slate-800 text-slate-800 cursor-not-allowed'
          }`}
          disabled={value <= 1}
        >
          <span className="mb-0.5">－</span>
        </button>
        
        <div className="flex flex-col items-center relative">
          <span className="text-3xl md:text-4xl font-orbitron font-black text-white tabular-nums drop-shadow-[0_0_15px_rgba(6,182,212,0.4)] z-10">
            {value.toString().padStart(2, '0')}
          </span>
          {/* Animated Glow behind number */}
          <div className="absolute inset-0 bg-cyan-500/5 blur-xl group-hover:bg-cyan-500/10 transition-all" />
        </div>

        <button 
          onClick={() => onChange(Math.min(10, value + 1))}
          className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center border transition-all shrink-0 font-black ${
            value < 10 && canIncrease ? 'border-cyan-500/30 text-cyan-500 hover:bg-cyan-500 hover:text-black hover:border-cyan-300' : 'border-slate-800 text-slate-800 cursor-not-allowed'
          }`}
          disabled={value >= 10 || !canIncrease}
        >
          <span className="mb-0.5">＋</span>
        </button>
      </div>

      {/* Visual Progress Dots */}
      <div className="flex gap-1 mb-3 w-full justify-center">
        {Array.from({ length: 10 }).map((_, i) => (
          <div 
            key={i} 
            className={`h-1 flex-1 transition-all duration-500 ${i < value ? 'bg-cyan-500 shadow-[0_0_5px_#06b6d4]' : 'bg-slate-800'}`}
          />
        ))}
      </div>

      <div className={`w-full py-1 text-[10px] md:text-xs font-mono border-y transition-all ${modifier >= 0 ? 'bg-cyan-500/5 text-cyan-400 border-cyan-500/20' : 'bg-rose-500/5 text-rose-400 border-rose-500/20'}`}>
        <div className="flex justify-between px-2">
          <span className="opacity-50 tracking-tighter">MODIFIER</span>
          <span className="font-bold tracking-widest">{modSign}{modifier}</span>
        </div>
      </div>

      <p className="mt-3 md:mt-4 text-[9px] md:text-[10px] text-slate-400 text-center leading-tight uppercase font-medium h-10 flex items-center justify-center w-full px-1 font-mono tracking-tighter opacity-60 group-hover:opacity-100 transition-opacity">
        {description}
      </p>
    </div>
  );
};

export default StatBox;
