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
  // Size variants
  const sizeClasses = {
    sm: "w-16 h-20",
    md: "w-20 h-28", 
    lg: "w-24 h-32"
  };

  const textSizes = {
    sm: { 
      rating: "text-[10px]", 
      pos: "text-[9px]", 
      name: "text-[9px]", 
      price: "text-[9px]",
      stats: "text-[8px]"
    },
    md: { 
      rating: "text-xs", 
      pos: "text-[10px]", 
      name: "text-[10px]", 
      price: "text-[10px]",
      stats: "text-[9px]"
    },
    lg: { 
      rating: "text-sm", 
      pos: "text-xs", 
      name: "text-xs", 
      price: "text-xs",
      stats: "text-[10px]"
    }
  };

  // Card background based on player type - mimicking FUT card colors
  const getCardBackground = () => {
    if (player.isIcon) {
      return "bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500";
    } else if (player.isHero) {
      return "bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600";
    } else if (player.rating >= 90) {
      return "bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600"; // Gold
    } else if (player.rating >= 85) {
      return "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500"; // Silver
    } else if (player.rating >= 75) {
      return "bg-gradient-to-br from-amber-600 via-yellow-700 to-amber-700"; // Bronze
    } else {
      return "bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800"; // Common
    }
  };

  // Text color based on card background
  const getTextColor = () => {
    if (player.isIcon || player.isHero || player.rating >= 75) {
      return "text-black";
    }
    return "text-white";
  };

  // Chemistry indicator
  const getChemStyles = () => {
    if (outOfPosition) {
      return {
        dot: "bg-red-500 ring-2 ring-red-300",
        glow: "shadow-red-500/50"
      };
    }
    
    switch (chem) {
      case 3:
        return {
          dot: "bg-green-400 ring-2 ring-green-200",
          glow: "shadow-green-400/50"
        };
      case 2:
        return {
          dot: "bg-yellow-400 ring-2 ring-yellow-200",
          glow: "shadow-yellow-400/50"
        };
      case 1:
        return {
          dot: "bg-orange-400 ring-2 ring-orange-200",
          glow: "shadow-orange-400/50"
        };
      default:
        return {
          dot: "bg-gray-400 ring-2 ring-gray-300",
          glow: "shadow-gray-400/50"
        };
    }
  };

  const chemStyles = getChemStyles();
  const textColor = getTextColor();

  return (
    <div className="relative group">
      <div
        className={`
          ${sizeClasses[size]}
          ${getCardBackground()}
          relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl
          transition-all duration-200 hover:-translate-y-1
          border border-black/20
          ${onClick ? 'cursor-pointer' : ''}
          ${outOfPosition ? 'ring-2 ring-red-500 ring-opacity-50' : ''}
        `}
        draggable={draggable}
        onDragStart={onDragStart}
        onClick={onClick}
      >
        {/* Card shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-50" />
        
        {/* Player image background */}
        {player.image_url && (
          <div className="absolute inset-0">
            <img 
              className="w-full h-full object-cover object-center opacity-90" 
              src={player.image_url} 
              alt={player.name}
              referrerPolicy="no-referrer"
            />
            {/* Subtle overlay to ensure text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        )}

        {/* Top section - Rating, Position, Chemistry */}
        <div className="absolute top-1 left-1 right-1 flex items-start justify-between z-10">
          <div className="flex flex-col items-start gap-0.5">
            {/* Rating */}
            <div className={`
              ${textColor} font-black px-1 py-0.5 rounded text-center min-w-[20px]
              ${textSizes[size].rating} 
              drop-shadow-lg
            `}>
              {player.rating || "-"}
            </div>
            
            {/* Position */}
            <div className={`
              ${textColor} font-bold px-1 rounded text-center min-w-[20px]
              ${textSizes[size].pos}
              drop-shadow-lg
            `}>
              {(player.positions?.[0] || "").toUpperCase()}
            </div>
          </div>

          {/* Chemistry dot */}
          <div 
            className={`
              w-2 h-2 rounded-full shadow-lg
              ${chemStyles.dot} ${chemStyles.glow}
            `}
            title={`Chemistry: ${outOfPosition ? 0 : chem}/3${outOfPosition ? ' • Out of position' : ''}`}
          />
        </div>

        {/* Special card indicators */}
        {(player.isIcon || player.isHero) && size !== "sm" && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2">
            {player.isIcon && (
              <div className="bg-orange-600/90 text-white text-[8px] px-1 py-0.5 rounded font-bold shadow-sm">
                ICN
              </div>
            )}
            {player.isHero && (
              <div className="bg-purple-600/90 text-white text-[8px] px-1 py-0.5 rounded font-bold shadow-sm">
                HRO
              </div>
            )}
          </div>
        )}

        {/* Custom badge */}
        {badge && (
          <div className="absolute top-1 right-1">
            {badge}
          </div>
        )}

        {/* Bottom section - Name and Price */}
        <div className="absolute bottom-1 left-1 right-1 z-10">
          {/* Player name */}
          <div className={`
            ${textColor} font-bold text-center truncate mb-0.5
            ${textSizes[size].name}
            drop-shadow-lg
          `}>
            {player.name}
          </div>

          {/* Price */}
          {typeof player.price === "number" && (
            <div className="flex items-center justify-center">
              <div className={`
                bg-black/70 ${textColor === 'text-black' ? 'text-yellow-200' : 'text-yellow-300'} 
                px-1.5 py-0.5 rounded text-center font-semibold
                ${textSizes[size].price}
                border border-yellow-400/30
              `}>
                {player.price.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Stats overlay for larger cards */}
        {size === "lg" && player.pace && (
          <div className="absolute left-1 top-1/2 -translate-y-1/2 space-y-0.5">
            <div className={`${textColor} ${textSizes[size].stats} font-bold drop-shadow-lg`}>
              <div>PAC {player.pace}</div>
              <div>SHO {player.shooting}</div>
              <div>PAS {player.passing}</div>
              <div>DRI {player.dribbling}</div>
              <div>DEF {player.defending}</div>
              <div>PHY {player.physicality}</div>
            </div>
          </div>
        )}
      </div>

      {/* Out of position indicator */}
      {outOfPosition && size !== "sm" && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20">
          <span className="text-[10px] text-red-300 bg-red-900/90 px-2 py-1 rounded-full font-bold border border-red-500/50">
            OOP
          </span>
        </div>
      )}

      {/* Hover actions */}
      {showActions && (onSwap || onClear) && (
        <div className="absolute -bottom-6 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
          <div className="flex justify-center gap-1">
            {onSwap && (
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2 py-1 rounded font-bold transition-colors shadow-lg border border-blue-500"
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
                className="bg-red-600 hover:bg-red-700 text-white text-[10px] px-2 py-1 rounded font-bold transition-colors shadow-lg border border-red-500"
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
