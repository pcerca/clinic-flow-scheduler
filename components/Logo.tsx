import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Cap / Nurse Hat */}
    <path d="M30 22 L36 6 L64 6 L70 22 Z" className="fill-white stroke-primaryDark stroke-[2]" />
    <rect x="42" y="10" width="16" height="5" className="fill-danger" />
    <rect x="47.5" y="5" width="5" height="15" className="fill-danger" />

    {/* Clock Body */}
    <circle cx="50" cy="55" r="40" className="fill-white stroke-primary stroke-[5] drop-shadow-sm" />
    
    {/* Funny Face */}
    {/* Eyes */}
    <ellipse cx="35" cy="45" rx="4" ry="5" className="fill-slate-700" />
    <ellipse cx="65" cy="45" rx="4" ry="5" className="fill-slate-700" />
    
    {/* Smile */}
    <path d="M35 65 Q50 78 65 65" className="stroke-slate-700 stroke-[4] stroke-linecap-round" />
    
    {/* Hands (acting as hands/moustache) */}
    <path d="M50 55 L25 45" className="stroke-primaryDark stroke-[5] stroke-linecap-round" />
    <path d="M50 55 L75 45" className="stroke-primaryDark stroke-[5] stroke-linecap-round" />
    
    {/* Center Pin */}
    <circle cx="50" cy="55" r="4" className="fill-slate-600" />
  </svg>
);