
import React, { useState, useEffect, useMemo, useRef } from 'react';
import CyberButton from './CyberButton.tsx';

interface Props {
  currentChg: number;
  onClose: () => void;
  onInitiate: (cost: number) => void;
  onSuccess: () => void;
}

type Tier = 1 | 2 | 3;

const HEX_CODES = ['1C', 'BD', '55', 'E9', 'FF', '7A'];
const TIER_COSTS: Record<Tier, number> = { 1: 3, 2: 6, 3: 8 };
const GAME_TIME_LIMIT = 15;

export const HackingMinigame: React.FC<Props> = ({ currentChg, onClose, onInitiate, onSuccess }) => {
  const [tier, setTier] = useState<Tier | null>(null);
  const [grid, setGrid] = useState<string[][]>([]);
  const [sequence, setSequence] = useState<string[]>([]);
  const [playerSequence, setPlayerSequence] = useState<string[]>([]);
  const [currentRow, setCurrentRow] = useState<number | null>(0);
  const [currentCol, setCurrentCol] = useState<number | null>(null);
  const [history, setHistory] = useState<[number, number][]>([]);
  const [status, setStatus] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [timeLeft, setTimeLeft] = useState<number>(GAME_TIME_LIMIT);
  const timerRef = useRef<number | null>(null);

  const gridSize = useMemo(() => (tier ? tier + 4 : 0), [tier]);
  const bufferSize = useMemo(() => (tier ? tier + 5 : 0), [tier]);

  useEffect(() => {
    if (status === 'playing' && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((p) => {
          if (p <= 1) { setStatus('lost'); return 0; }
          return p - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, timeLeft]);

  const initGame = (selectedTier: Tier) => {
    const cost = TIER_COSTS[selectedTier];
    if (currentChg < cost) return;
    const size = selectedTier + 4;
    const seqLen = selectedTier + 3;
    const newGrid: string[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => HEX_CODES[Math.floor(Math.random() * HEX_CODES.length)]));
    const newSequence: string[] = [];
    const seqPath: [number, number][] = [];
    let r = 0; let c = Math.floor(Math.random() * size);
    let changingRow = true;
    for (let i = 0; i < seqLen; i++) {
      newSequence.push(newGrid[r][c]);
      seqPath.push([r, c]);
      if (changingRow) {
        let nextR; let attempts = 0;
        do { nextR = Math.floor(Math.random() * size); attempts++; } while (attempts < 20 && (nextR === r || seqPath.some(([pr, pc]) => pr === nextR && pc === c)));
        r = nextR;
      } else {
        let nextC; let attempts = 0;
        do { nextC = Math.floor(Math.random() * size); attempts++; } while (attempts < 20 && (nextC === c || seqPath.some(([pr, pc]) => pr === r && pc === nextC)));
        c = nextC;
      }
      changingRow = !changingRow;
    }
    onInitiate(cost);
    setTier(selectedTier); setGrid(newGrid); setSequence(newSequence); setPlayerSequence([]);
    setCurrentRow(0); setCurrentCol(null); setHistory([]); setTimeLeft(GAME_TIME_LIMIT); setStatus('playing');
  };

  const handleCellClick = (r: number, c: number) => {
    if (status !== 'playing' || history.some(([hr, hc]) => hr === r && hc === c)) return;
    if (currentRow !== null && r !== currentRow) return;
    if (currentCol !== null && c !== currentCol) return;
    const code = grid[r][c];
    const newPlayerSeq = [...playerSequence, code];
    setPlayerSequence(newPlayerSeq);
    setHistory([...history, [r, c]]);
    const isMatching = newPlayerSeq.every((code, idx) => code === sequence[idx]);
    if (isMatching && newPlayerSeq.length === sequence.length) { setStatus('won'); setTimeout(() => onSuccess(), 1000); return; }
    if (newPlayerSeq.length >= bufferSize || (!isMatching && newPlayerSeq.length >= sequence.length)) { setStatus('lost'); return; }
    if (currentRow !== null) { setCurrentRow(null); setCurrentCol(c); } else { setCurrentCol(null); setCurrentRow(r); }
  };

  if (!tier) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 font-rajdhani">
        <div className="w-full max-w-md cyber-card p-10 bg-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.8)] border-cyan-500/40">
           <h2 className="text-4xl font-orbitron font-black text-white neon-text-cyan uppercase mb-10 text-center tracking-widest">Protocol_Select</h2>
           <div className="space-y-4">
             {[1, 2, 3].map((t) => (
               <button 
                  key={t}
                  onClick={() => initGame(t as Tier)} 
                  disabled={currentChg < TIER_COSTS[t as Tier]}
                  className="w-full py-5 border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500 hover:text-black transition-all font-orbitron font-bold uppercase tracking-widest flex justify-between px-8 disabled:opacity-20 group"
               >
                 <div className="text-left">
                   <div className="text-sm">Tier_0{t}</div>
                   <div className="text-[9px] opacity-60 font-mono">COST: {TIER_COSTS[t as Tier]} NC</div>
                 </div>
                 <div className="text-[10px] opacity-40 group-hover:opacity-100 flex items-center">LINK_INTERFACE</div>
               </button>
             ))}
             <CyberButton variant="secondary" onClick={onClose} className="w-full mt-8">Abort_Uplink</CyberButton>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/98 backdrop-blur-2xl p-4 md:p-10 font-mono overflow-hidden">
      <div className="w-full max-w-5xl cyber-card p-6 md:p-10 bg-slate-950 border-cyan-500/20 shadow-[0_0_150px_rgba(6,182,212,0.1)]">
        <header className="flex justify-between items-end border-b border-cyan-900/40 pb-6 mb-8">
           <div className="space-y-1">
             <h2 className="text-2xl md:text-3xl font-orbitron font-black text-white uppercase tracking-tighter flex items-center gap-4">
               <span className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_#06b6d4]" /> BREACH_PROTOCOL_v2.0
             </h2>
             <p className="text-[10px] text-cyan-500/60 uppercase tracking-[0.4em]">Target_Subnet_ID: NC_NODE_{tier}</p>
           </div>
           <div className="flex gap-10 items-end">
             <div className="text-right">
                <div className="text-[9px] text-slate-500 uppercase mb-2">Neural_Buffer</div>
                <div className="flex gap-1.5">
                  {Array.from({ length: bufferSize }).map((_, i) => (
                    <div key={i} className={`w-4 h-5 border transition-all duration-300 ${playerSequence[i] ? 'bg-cyan-500 border-cyan-300 shadow-[0_0_8px_#06b6d4]' : 'border-slate-800 bg-slate-900/50'}`} />
                  ))}
                </div>
             </div>
             <div className="text-right min-w-[120px]">
               <div className="text-[9px] text-slate-500 uppercase mb-1">Trace_Timer</div>
               <div className={`text-4xl font-orbitron font-black tabular-nums leading-none transition-colors ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`}>
                 {timeLeft.toString().padStart(2, '0')}<span className="text-xs opacity-40 ml-1">S</span>
               </div>
             </div>
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-7">
            <div className="text-[10px] text-slate-600 uppercase mb-4 tracking-widest font-bold">Code_Matrix_Matrix</div>
            <div className="bg-black/40 border border-slate-900 p-4 grid gap-1 relative overflow-hidden" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
              {grid.map((row, r) => row.map((cell, c) => {
                const isSelected = history.some(([hr, hc]) => hr === r && hc === c);
                const isActive = (currentRow === r) || (currentCol === c);
                return (
                  <button
                    key={`${r}-${c}`}
                    disabled={status !== 'playing' || isSelected || !isActive}
                    onClick={() => handleCellClick(r, c)}
                    className={`
                      h-10 md:h-14 flex items-center justify-center text-sm md:text-xl font-black transition-all border
                      ${isSelected ? 'bg-slate-900/20 border-transparent opacity-10 scale-90' : ''}
                      ${!isSelected && isActive ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:border-cyan-300' : 'border-slate-800 text-slate-800 opacity-20'}
                      ${!isSelected && ((currentRow === r && currentCol === null) || (currentCol === c && currentRow === null)) ? 'animate-pulse' : ''}
                    `}
                  >
                    {cell}
                  </button>
                );
              }))}
            </div>
          </div>

          <div className="md:col-span-5 space-y-8 flex flex-col">
            <section>
              <div className="text-[10px] text-slate-600 uppercase mb-4 tracking-widest font-bold">Target_Sequence_Hash</div>
              <div className="flex gap-3">
                {sequence.map((code, idx) => (
                  <div key={idx} className={`w-12 h-12 md:w-16 md:h-16 flex items-center justify-center border-2 font-black text-lg md:text-2xl transition-all duration-500 ${playerSequence[idx] === code ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : playerSequence[idx] ? 'bg-rose-500/20 border-rose-500 text-rose-500' : 'border-slate-800 bg-slate-900/40 text-slate-700'}`}>
                    {code}
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-black/60 border border-slate-800 p-6 relative flex-1 min-h-[120px] flex items-center justify-center">
               <div className="absolute top-2 left-3 text-[7px] text-slate-600 tracking-widest font-mono">STATUS_LOG:</div>
               {status === 'won' && <div className="text-emerald-400 font-black animate-bounce text-center uppercase text-xl md:text-2xl tracking-[0.2em]">ACCESS_GRANTED</div>}
               {status === 'lost' && <div className="text-rose-500 font-black animate-pulse text-center uppercase text-xl md:text-2xl tracking-[0.2em]">{timeLeft <= 0 ? 'TRACE_COMPLETE' : 'SIGNAL_LOST'}</div>}
               {status === 'playing' && (
                 <div className="text-[10px] text-slate-500 uppercase leading-relaxed font-mono italic text-center w-full">
                   Neural integrity verified... <br />
                   Align harmonics to target sequence... <br />
                   Buffer depth at critical threshold...
                 </div>
               )}
            </section>

            <CyberButton variant="secondary" onClick={onClose} className="w-full">Disconnect_Uplink</CyberButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HackingMinigame;
