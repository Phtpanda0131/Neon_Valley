
import React from 'react';
import { Gender } from '../types.ts';
import { PORTRAIT_PRESETS } from '../constants.tsx';

interface Props {
  selectedGender: Gender;
  onSelect: (url: string) => void;
  currentPortrait: string;
}

const PortraitGallery: React.FC<Props> = ({ selectedGender, onSelect, currentPortrait }) => {
  const filtered = PORTRAIT_PRESETS.filter(p => p.gender === selectedGender);

  return (
    <div className="flex flex-wrap gap-4 mt-4">
      {filtered.map((portrait) => (
        <button
          key={portrait.id}
          onClick={() => onSelect(portrait.url)}
          className={`relative w-24 h-24 overflow-hidden border-2 transition-all group ${
            currentPortrait === portrait.url ? 'border-cyan-400 scale-110 z-10' : 'border-slate-700 hover:border-cyan-600'
          }`}
          title={portrait.description}
        >
          <img 
            src={portrait.url} 
            alt={portrait.name} 
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" 
          />
          <div className="absolute inset-0 bg-cyan-400/10 group-hover:bg-transparent" />
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] py-1 text-center font-mono">
            {portrait.name}
          </div>
        </button>
      ))}
    </div>
  );
};

export default PortraitGallery;
