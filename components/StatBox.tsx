
import React from 'react';

interface Props {
  label: string;
  value: number;
  description: string;
  onChange: (val: number) => void;
  canIncrease: boolean;
}

const StatBox: React.FC<Props> = ({ label, value, description, onChange, canIncrease }) => {
  // 4 is base. Every 2 points up or down adds 1 point to efficiency.
  const modifier = Math.floor((value - 4) / 2);
  const modSign = modifier >= 0 ? '+' : '';

  return (
    <div className="bg-slate-900/50 border border-slate-700 p-2 md:p-4 flex flex-col items-center group hover:border-cyan-500/50 transition-colors relative overflow-hidden h-full">
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <span className="text-[10px] md:text-sm uppercase font-orbitron text-slate-400 group-hover:text-cyan-400 transition-colors tracking-widest truncate w-full text-center">
        {label}
      </span>
      
      <div className="flex items-center gap-2 md:gap-5 my-2 md:my-4">
        <button 
          onClick={() => onChange(Math.max(1, value - 1))}
          className={`w-7 h-7 md:w-10 md:h-10 flex items-center justify-center border border-slate-700 text-base md:text-xl font-bold transition-all shrink-0 ${
            value > 1 ? 'text-cyan-500 hover:bg-cyan-500/10 hover:border-cyan-500' : 'text-slate-800 cursor-not-allowed'
          }`}
          disabled={value <= 1}
        >-</button>
        
        <div className="flex flex-col items-center shrink-0">
          <span className="text-2xl md:text-5xl font-orbitron font-black text-white tabular-nums drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
            {value}
          </span>
        </div>

        <button 
          onClick={() => onChange(Math.min(10, value + 1))}
          className={`w-7 h-7 md:w-10 md:h-10 flex items-center justify-center border border-slate-700 text-base md:text-xl font-bold transition-all shrink-0 ${
            value < 10 && canIncrease ? 'text-cyan-500 hover:bg-cyan-500/10 hover:border-cyan-500' : 'text-slate-800 cursor-not-allowed'
          }`}
          disabled={value >= 10 || !canIncrease}
        >+</button>
      </div>

      <div className={`px-2 md:px-5 py-1 text-[9px] md:text-sm font-mono border truncate w-full text-center ${modifier >= 0 ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
        EFF {modSign}{modifier}
      </div>

      <p className="mt-2 md:mt-4 text-[8px] md:text-xs text-slate-500 text-center leading-tight uppercase font-medium h-8 md:h-10 flex items-center justify-center w-full break-words overflow-hidden">
        {description}
      </p>
    </div>
  );
};

export default StatBox;
