import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const base = "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary to-primaryDark text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:to-cyan-700 focus:ring-primary",
    secondary: "bg-white text-slate-600 border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 focus:ring-slate-400",
    danger: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 focus:ring-red-500",
    success: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 focus:ring-emerald-500",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900"
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-5 py-2 text-sm",
    lg: "h-12 px-8 text-base",
  };

  return (
    <button 
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};