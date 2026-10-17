'use client';

import React from 'react';

interface HestraLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtext?: string;
  className?: string;
}

export default function HestraLogo({
  size = 'md',
  showText = true,
  subtext,
  className = '',
}: HestraLogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-3 overflow-hidden ${className}`}>
      {/* HESTRA SVG Vector Brandmark */}
      <div
        className={`${iconSizes[size]} rounded-xl shadow-md shadow-indigo-600/20 shrink-0 overflow-hidden relative group transition-transform hover:scale-105`}
      >
        <svg
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="hestraBg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4338ca" />
              <stop offset="45%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>
            <linearGradient id="hestraGold" x1="12" y1="18" x2="32" y2="26" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="hestraPillar" x1="0" y1="0" x2="0" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e0e7ff" />
            </linearGradient>
          </defs>

          {/* Background Squircle */}
          <rect width="44" height="44" rx="13" fill="url(#hestraBg)" />
          
          {/* Subtle geometric pattern accent */}
          <circle cx="44" cy="0" r="18" fill="#6366f1" fillOpacity="0.25" />
          <circle cx="0" cy="44" r="14" fill="#f59e0b" fillOpacity="0.15" />

          {/* Left Vertical Pillar of 'H' */}
          <path
            d="M12 11C12 9.89543 12.8954 9 14 9H16.5C17.6046 9 18.5 9.89543 18.5 11V33C18.5 34.1046 17.6046 35 16.5 35H14C12.8954 35 12 34.1046 12 33V11Z"
            fill="url(#hestraPillar)"
          />

          {/* Right Vertical Pillar of 'H' */}
          <path
            d="M25.5 11C25.5 9.89543 26.3954 9 27.5 9H30C31.1046 9 32 9.89543 32 11V33C32 34.1046 31.1046 35 30 35H27.5C26.3954 35 25.5 34.1046 25.5 33V11Z"
            fill="url(#hestraPillar)"
          />

          {/* Dynamic Interlocking HRM Bridge (Connecting People & Growth) */}
          <path
            d="M18.5 20H25.5V24H18.5V20Z"
            fill="url(#hestraGold)"
          />
          
          {/* Central Pulse Gem Node */}
          <circle cx="22" cy="22" r="2.2" fill="#ffffff" />

          {/* Golden HRM Status Pip */}
          <circle cx="34.5" cy="9.5" r="2.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
        </svg>
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black text-slate-900 tracking-tight font-sans ${textSizes[size]}`}
            >
              HESTRA
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-extrabold bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-2xs tracking-wider">
              HRM
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
            {subtext || 'Human Resource Management'}
          </span>
        </div>
      )}
    </div>
  );
}
