// src/components/squad/PlayerTile.jsx
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
  const coin = "https://cdn2.futbin.com/https%3A%2F%2Fcdn.futbin.com%2Fdesign%2Fimg%2Fcoins_big.png?fm=png&ixlib=java-2.1.0&w=40&s=cad4ceb684da7f0b778fdeb1d4065fb1";

  // Size variants for different use cases
  const sizeClasses = {
    sm: "w-16 h-20",
    md: "w-20 h-28", 
    lg: "w-24 h-32"
  };

  const textSizes = {
    sm: { rating: "text-xs", pos: "text-xs", name: "text-xs", price: "text-xs" },
    md: { rating: "text-xs", pos: "text-xs", name: "text-xs", price: "text-xs" },
    lg: { rating: "text-sm", pos: "text-sm", name: "text-sm", price: "text-sm" }
  };

  // Enhanced card styling based on player type
  const getCardClasses = () => {
    let base = `${sizeClasses[size]} squad-card rounded-xl relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl border`;
    
    if (player.isIcon) {
      base += " bg-gradient-to-br from-orange-500/40 via-yellow-500/40 to-orange-600/40 border-orange-500/50";
    } else if (player.isHero) {
      base += " bg-gradient-to-br from-purple-500/40 via-pink-500/40 to-purple-600/40 border-purple-500/50";
    } else {
      base += " bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-gray-600";
    }

    if (outOfPosition) {
      base += " ring-2 ring-red-500/50";
    }

    if (onClick) {
      base += " cursor-pointer";
    }

    return base;
  };

  // Chemistry dot color
  const getChemDotClass = () => {
    if (outOfPosition) return "bg-red-500 animate-pulse";
    if (chem >= 3) return "bg-lime-400";
    if (chem === 2) return "bg-yellow-400";
    if (chem === 1) return "bg-orange-400";
    return "bg-gray-500";
  };

  return (
    <div className="relative group">
      <div
        className={getCardClasses()}
        draggable={draggable}
        onDragStart={onDragStart}
        onClick={onClick}
      >
        {/* Card frame overlay for premium feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-xl" />

        {/* Player image */}
        {player.image_url && (
          <img 
            className="absolute inset-0 w-full h-full object-cover object-top" 
            src={player.image_url} 
            alt={player.name} 
            referrerPolicy="no-referrer"
          />
        )}

        {/* Top badges row */}
        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center gap-1.5">
          {/* Rating badge */}
          <span className={`bg-yellow-400 text-black font-black px-1.5 py-0.5 rounded-md shadow-sm ${textSizes[size].rating}`}>
            {player.rating || "-"}
          </span>
          
          {/* Position badge */}
          <span className={`bg-white/95 text-black font-black px-1.5 py-0.5 rounded-md shadow-sm ${textSizes[size].pos}`}>
            {(player.positions?.[0] || "").toUpperCase()}
          </span>
          
          {/* Custom badge slot */}
          {badge}

          {/* Special card indicators */}
          {player.isIcon && size !== "sm" && (
            <span className="text-xs bg-orange-500/90 text-white px-1 py-0.5 rounded font-bold">
              ICN
            </span>
          )}
          {player.isHero && size !== "sm" && (
            <span className="text-xs bg-purple-500/90 text-white px-1 py-0.5 rounded font-bold">
              HRO
            </span>
          )}

          {/* Chemistry indicator */}
          <div 
            className={`ml-auto w-2.5 h-2.5 rounded-full border border-black/30 shadow-sm ${getChemDotClass()}`}
            title={`Chemistry: ${chem}/3${outOfPosition ? ' • Out of position' : ''}`}
          />
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-1.5 left-1.5 right-1.5">
          {/* Player name */}
          <div className={`text-white font-bold truncate drop-shadow-lg ${textSizes[size].name} mb-1`}>
            {player.name}
          </div>

          {/* Price */}
          {typeof player.price === "number" && (
            <div className={`flex items-center gap-1 bg-black/60 rounded px-1.5 py-0.5 ${textSizes[size].price}`}>
              <img className="w-2.5 h-2.5" src={coin} alt="coins" />
              <span className="text-yellow-200 font-semibold">
                {player.price.toLocaleString()}c
              </span>
            </div>
          )}
        </div>

        {/* Out of position overlay */}
        {outOfPosition && (
          <div className="absolute inset-0 bg-red-500/10 border-2 border-red-500/30 rounded-xl pointer-events-none" />
        )}
      </div>

      {/* Out of position warning label */}
      {outOfPosition && size !== "sm" && (
        <div className="absolute -bottom-5 left-0 right-0 text-center">
          <span className="text-xs text-red-400 bg-red-900/80 px-2 py-0.5 rounded-full border border-red-500/50 shadow-sm">
            OOP
          </span>
        </div>
      )}

      {/* Hover actions (if enabled) */}
      {showActions && (onSwap || onClear) && (
        <div className="absolute -bottom-8 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
          <div className="flex justify-center gap-1.5">
            {onSwap && (
              <button
                className="bg-gray-800/95 hover:bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 transition-colors shadow-sm"
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
                className="bg-red-800/95 hover:bg-red-700 text-white text-xs px-2 py-1 rounded border border-red-600 transition-colors shadow-sm"
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
