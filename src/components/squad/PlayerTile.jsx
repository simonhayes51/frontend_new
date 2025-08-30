// src/components/squad/PlayerTile.jsx - Clean overlays over card image
import React from "react";

export default function PlayerTile({
  player,
  badge,
  draggable = false,
  onDragStart,
  outOfPosition = false,
  chem = 0,
  size = "md",
  onClick,
  showActions = false,
  onSwap,
  onClear,
}) {
  // Size variants
  const sizeClasses = {
    sm: "w-16 h-20",
    md: "w-20 h-28", 
    lg: "w-24 h-32"
  };

  const textSizes = {
    sm: { pos: "text-xs", price: "text-xs" },
    md: { pos: "text-sm", price: "text-xs" },
    lg: { pos: "text-base", price: "text-sm" }
  };

  // Chemistry dot color
  const getChemDotClass = () => {
    if (outOfPosition) return "bg-red-500 animate-pulse";
    if (chem >= 3) return "bg-green-400";
    if (chem === 2) return "bg-yellow-400";
    if (chem === 1) return "bg-orange-400";
    return "bg-gray-400";
  };

  return (
    <div className="relative group">
      <div
        className={`
          ${sizeClasses[size]}
          relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl
          transition-all duration-200 hover:-translate-y-1
          ${onClick ? 'cursor-pointer' : ''}
          ${outOfPosition ? 'ring-2 ring-red-500/50' : ''}
        `}
        draggable={draggable}
        onDragStart={onDragStart}
        onClick={onClick}
      >
        {/* Full card image */}
        {player.image_url && (
          <img 
            className="w-full h-full object-cover" 
            src={player.image_url} 
            alt={player.name}
            referrerPolicy="no-referrer"
          />
        )}

        {/* Position overlay - top left */}
        <div className="absolute top-2 left-2">
          <div className={`
            bg-black/80 text-white font-bold px-2 py-1 rounded-md shadow-lg
            backdrop-blur-sm border border-white/20
            ${textSizes[size].pos}
          `}>
            {(player.positions?.[0] || "").toUpperCase()}
          </div>
        </div>

        {/* Chemistry dot - top right */}
        <div className="absolute top-2 right-2">
          <div 
            className={`
              w-3 h-3 rounded-full shadow-lg ring-2 ring-white/50
              ${getChemDotClass()}
            `}
            title={`Chemistry: ${outOfPosition ? 0 : chem}/3${outOfPosition ? ' • Out of position' : ''}`}
          />
        </div>

        {/* Price pill - bottom center */}
        {typeof player.price === "number" && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <div className={`
              bg-black/90 text-yellow-300 font-bold px-3 py-1.5 rounded-full shadow-lg
              backdrop-blur-sm border border-yellow-400/30
              ${textSizes[size].price}
            `}>
              {player.price.toLocaleString()}
            </div>
          </div>
        )}

        {/* Custom badge */}
        {badge && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
            {badge}
          </div>
        )}

        {/* Special card indicators */}
        {(player.isIcon || player.isHero) && size !== "sm" && (
          <div className="absolute bottom-2 right-2">
            {player.isIcon && (
              <div className="bg-orange-600/90 text-white text-xs px-2 py-1 rounded font-bold shadow-sm backdrop-blur-sm">
                ICON
              </div>
            )}
            {player.isHero && (
              <div className="bg-purple-600/90 text-white text-xs px-2 py-1 rounded font-bold shadow-sm backdrop-blur-sm">
                HERO
              </div>
            )}
          </div>
        )}
      </div>

      {/* Out of position warning */}
      {outOfPosition && size !== "sm" && (
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
          <span className="text-xs text-red-300 bg-red-900/90 px-2 py-1 rounded-full font-bold border border-red-500/50">
            OOP
          </span>
        </div>
      )}

      {/* Hover actions */}
      {showActions && (onSwap || onClear) && (
        <div className="absolute -bottom-8 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
          <div className="flex justify-center gap-1.5">
            {onSwap && (
              <button
                className="bg-blue-600/95 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded font-bold transition-colors shadow-lg backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwap();
                }}
              >
                Swap
              </button>
            )}
            {onClear && (
              <button
                className="bg-red-600/95 hover:bg-red-700 text-white text-xs px-2 py-1 rounded font-bold transition-colors shadow-lg backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
