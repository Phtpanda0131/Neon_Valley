
import React from 'react';

interface Props {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  disabled?: boolean;
}

const CyberButton: React.FC<Props> = ({ onClick, children, variant = 'primary', className = '', disabled }) => {
  const baseStyles = "relative font-orbitron text-[10px] md:text-xs font-black uppercase tracking-[0.2em] py-3 px-6 md:px-8 transition-all duration-300 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-center leading-none overflow-hidden shrink-0 group/btn";
  
  const variants = {
    primary: "bg-cyan-500 text-black hover:bg-white hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] border-none",
    secondary: "bg-transparent text-cyan-400 border border-cyan-500/40 hover:border-cyan-300 hover:text-white hover:bg-cyan-500/10",
    danger: "bg-rose-600 text-white hover:bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.2)] border-none"
  };

  return (
    <button 
      onClick={onClick} 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled}
      style={{
        clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))'
      }}
    >
      {/* Decorative inner elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-0 left-0 w-1 h-full bg-white/20 group-hover/btn:bg-white/40 transition-colors" />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10" />
      </div>
      
      <span className="relative z-10 w-full truncate flex items-center justify-center gap-2">
        {variant === 'danger' && <span className="text-[8px] animate-pulse">●</span>}
        {children}
      </span>
      
      {/* Scanning light animation on hover */}
      <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out pointer-events-none" />
    </button>
  );
};

export default CyberButton;
