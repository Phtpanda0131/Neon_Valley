
import React from 'react';

interface Props {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  disabled?: boolean;
}

const CyberButton: React.FC<Props> = ({ onClick, children, variant = 'primary', className = '', disabled }) => {
  const baseStyles = "relative font-orbitron text-base uppercase tracking-widest py-3 px-6 transition-all duration-300 clip-path-cyber active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-cyan-600 text-white hover:bg-cyan-500 border-l-4 border-cyan-300",
    secondary: "bg-slate-800 text-cyan-400 border border-cyan-800 hover:border-cyan-400 hover:text-white",
    danger: "bg-rose-900 text-rose-100 hover:bg-rose-700 border-l-4 border-rose-400"
  };

  return (
    <button 
      onClick={onClick} 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled}
      style={{
        clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)'
      }}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export default CyberButton;
