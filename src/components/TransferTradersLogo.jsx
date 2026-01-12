import React from 'react';

/**
 * Transfer Traders Logo Component
 * Modern gradient logo matching the cyan-purple brand
 */
export default function TransferTradersLogo({ size = "md", showText = true, className = "" }) {
  const sizes = {
    sm: { icon: "w-8 h-8", text: "text-xl" },
    md: { icon: "w-12 h-12", text: "text-3xl" },
    lg: { icon: "w-16 h-16", text: "text-4xl" },
    xl: { icon: "w-24 h-24", text: "text-5xl" },
  };

  const sizeClasses = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon - Gradient TT */}
      <div className={`${sizeClasses.icon} relative`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00D4FF" />
              <stop offset="50%" stopColor="#0099FF" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>
          {/* Stylized TT symbol */}
          <path
            d="M 20 20 L 45 20 L 45 35 L 35 35 L 35 80 L 20 80 Z"
            fill="url(#logoGradient)"
            className="drop-shadow-lg"
          />
          <path
            d="M 55 20 L 80 20 L 80 35 L 70 35 L 70 80 L 55 80 Z"
            fill="url(#logoGradient)"
            className="drop-shadow-lg"
            opacity="0.85"
          />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`${sizeClasses.text} font-display font-bold bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-purple bg-clip-text text-transparent`}>
            Transfer
          </span>
          <span className={`${sizeClasses.text} font-display font-bold bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent -mt-1`}>
            Traders
          </span>
        </div>
      )}
    </div>
  );
}

// Compact horizontal version
export function TransferTradersLogoCompact({ className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 100 100" className="w-8 h-8">
        <defs>
          <linearGradient id="logoGradientCompact" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D4FF" />
            <stop offset="50%" stopColor="#0099FF" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
        <path d="M 20 20 L 45 20 L 45 35 L 35 35 L 35 80 L 20 80 Z" fill="url(#logoGradientCompact)" />
        <path d="M 55 20 L 80 20 L 80 35 L 70 35 L 70 80 L 55 80 Z" fill="url(#logoGradientCompact)" opacity="0.85" />
      </svg>
      <span className="text-xl font-display font-bold">
        <span className="bg-gradient-to-r from-brand-cyan to-brand-blue bg-clip-text text-transparent">Transfer</span>
        {" "}
        <span className="bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent">Traders</span>
      </span>
    </div>
  );
}
