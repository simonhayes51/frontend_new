// src/components/squad/PlayerTile.jsx - FutBin Style
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
  // Size variants - proper proportions like FutBin
  const sizeClasses = {
    sm: "w-16 h-20",
    md: "w-20 h-28", 
    lg: "w-24 h-32"
  };

  const textSizes = {
    sm: { 
      rating: "text-xs", 
      pos: "text-xs", 
      name: "text-xs", 
      price: "text-xs"
    },
    md: { 
      rating: "text-sm", 
      pos: "text-xs", 
      name: "text-xs", 
      price: "text-xs"
    },
    lg: { 
      rating: "text-base", 
      pos: "text-sm", 
      name: "text-sm", 
      price: "text-sm"
    }
  };

  // Clean card background - much more subtle like FutBin
  const getCardStyles = () => {
    let bgClass = "bg-gray-800";
    let borderClass = "border-gray-600";
    let textClass = "text-white";

    if (player.isIcon) {
      bgClass = "bg-gradient-to-b from-orange-400 to-orange-500";
      borderClass = "border-orange-300";
      textClass = "text-white";
    } else if (player.isHero) {
      bgClass = "bg-gradient-to-b from-purple-500 to-purple-600";
      borderClass = "border-purple-300";
      textClass = "text-white";
    } else if (player.rating >= 90) {
      // Gold - very subtle
      bgClass = "bg-gradient-to-b from-yellow-100 to-yellow-200";
      borderClass = "border-yellow-300";
      textClass = "text-gray-900";
    } else if (player.rating >= 85) {
      // Silver - clean and minimal
      bgClass = "bg-gradient-to-b from-gray-100 to-gray-200";
      borderClass = "border-gray-300";
      textClass = "text-gray-900";
    } else if (player.rating >= 75) {
      // Bronze - warm but subtle
      bgClass = "bg-gradient-to-b from-amber-100 to-amber-200";
      borderClass = "border-amber-300";
      textClass = "text-gray-900";
    }

    return { bgClass, borderClass, textClass };
  };

  // Chemistry dot styling
  const getChemDot = () => {
    if (outOfPosition) return "bg-red-500";
    if (chem >= 3) return "bg-green-500";
    if (chem === 2) return "bg-yellow-500";
    if (chem === 1) return "bg-orange-500";
    return "bg-gray-400";
  };

  const { bgClass, borderClass, textClass } = getCardStyles();

  return (
    <div className="relative group">
      <div
        className={`
          ${sizeClasses[size]}
          ${bgClass}
          ${borderClass}
          relative rounded-lg border-2 shadow-sm hover:shadow-md transition-all duration-200
          ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}
          ${outOfPosition ? 'ring-2 ring-red-500' : ''}
        `}
        draggable={draggable}
        onDragStart={onDragStart}
        onClick={onClick}
      >
        {/* Player image - positioned behind content */}
        {player.image_url && (
          <div className="absolute inset-0 rounded-lg overflow-hidden">
            <img 
              className="w-full h-full object-cover object-center opacity-20" 
              src={player.image_url} 
              alt={player.name}
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Top row - Rating and Position */}
        <div className="absolute top-1 left-1 right-1 flex justify-between items-start z-10">
          <div className="flex flex-col items-start">
            {/* Rating */}
            <div className={`
              ${textClass} font-black px-1.5 py-0.5 bg-black/10 rounded text-center
              ${textSizes[size].rating}
            `}>
              {player.rating || "-"}
            </div>
            
            {/* Position */}
            <div className={`
              ${textClass} font-bold px-1.5 py-0.5 bg-black/10 rounded text-center mt-0.5
              ${textSizes[size].pos}
            `}>
              {(player.positions?.[0] || "").toUpperCase()}
            </div>
          </div>

          {/* Chemistry dot */}
          <div 
            className={`
              w-2.5 h-2.5 rounded-full border border-white/50 shadow-sm
              ${getChemDot()}
            `}
            title={`Chemistry: ${outOfPosition ? 0 : chem}/3${outOfPosition ? ' • Out of position' : ''}`}
          />
        </div>

        {/* Special badges */}
        {(player.isIcon || player.isHero) && size !== "sm" && (
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2">
            {player.isIcon && (
              <span className="bg-orange-600 text-white text-xs px-1 py-0.5 rounded font-bold">
                ICON
              </span>
            )}
            {player.isHero && (
              <span className="bg-purple-600 text-white text-xs px-1 py-0.5 rounded font-bold">
                HERO
              </span>
            )}
          </div>
        )}

        {/* Custom badge */}
        {badge && (
          <div className="absolute top-1 right-1 z-20">
            {badge}
          </div>
        )}

        {/* Bottom content - Name and Price */}
        <div className="absolute bottom-1 left-1 right-1 z-10">
          {/* Player name */}
          <div className={`
            ${textClass} font-semibold text-center truncate mb-1 px-1 py-0.5 bg-black/10 rounded
            ${textSizes[size].name}
          `}>
            {player.name}
          </div>

          {/* Price */}
          {typeof player.price === "number" && (
            <div className="text-center">
              <div className={`
                ${textClass} font-bold px-2 py-0.5 bg-black/20 rounded-full inline-block
                ${textSizes[size].price}
              `}>
                {player.price.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Out of position warning */}
      {outOfPosition && size !== "sm" && (
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
          <span className="text-xs text-red-400 bg-red-900/90 px-2 py-0.5 rounded-full font-bold">
            OOP
          </span>
        </div>
      )}

      {/* Hover actions */}
      {showActions && (onSwap || onClear) && (
        <div className="absolute -bottom-6 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex justify-center gap-1">
            {onSwap && (
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded font-bold"
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
                className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded font-bold"
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
