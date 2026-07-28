// src/components/PlayerCardArt.jsx
// Shared FUT-card rendering used by both the Player Search detail view and
// Player Compare. futbin has no single flat card image - it composites a
// card-template background PNG with a separate player cutout PNG, and
// draws rating/name/stats as HTML on top of both rather than baking them
// into either image. This reproduces that: two stacked <img> layers plus a
// proportionally-positioned text overlay, calibrated against real futbin
// cards via a temporary on-screen coordinate grid.
import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";
const buildProxy = (url) => `${API_BASE}/img?url=${encodeURIComponent(url)}`;

export default function PlayerCardArt({
  bgImage,
  cutoutImage,
  cutoutType,
  fallbackImage,
  rating,
  position,
  name,
  stats,
  nationImage,
  leagueImage,
  clubImage,
  versionLabel,
  altText,
  widthClass = "w-48",
  // List-row usage (v2's card art, ~32-56px wide) has no room for the
  // name/6-stat-grid/mini-badge overlay block below - its fixed text
  // sizes (text-xl/text-[10px]/text-[6px]) don't scale down further and
  // would overflow at that size. compact keeps just the layered
  // bg+cutout art plus a single small rating chip. Purely additive -
  // neither existing call site (PlayerSearch.jsx, PlayerCompare.jsx)
  // passes this, so their current rendering is unchanged.
  compact = false,
  // Non-compact but still too narrow for the 6-stat grid to stay legible
  // (e.g. a ~130-160px card in a 3-across row) - name/rating/position
  // still fit fine at that width, only the stat grid + nation/league/
  // club icons need to drop. Defaults true so every existing non-compact
  // call site (full ~192px cards) is unaffected.
  showStats = true,
}) {
  // Card images don't all share one fixed aspect ratio, and object-contain
  // inside a hardcoded box letterboxes whichever ones don't match -
  // shifting the overlay away from the card's actual visible edges.
  // Measuring the real background image once it loads and sizing the box
  // to match eliminates that letterboxing entirely.
  const [cardAspect, setCardAspect] = useState(0.75);

  // Gold/silver/bronze ("base") card art is light-colored, so white
  // overlay text reads poorly against it - special/rare cards are dark or
  // colorful enough that white still works there.
  const overlayTextClass =
    cutoutType === "base"
      ? "text-black [text-shadow:0_1px_2px_rgba(255,255,255,0.85)]"
      : "text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]";
  const overlayTextMutedClass =
    cutoutType === "base"
      ? "text-black/80 [text-shadow:0_1px_2px_rgba(255,255,255,0.85)]"
      : "text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]";

  return (
    <div className={`relative ${widthClass}`} style={{ aspectRatio: cardAspect }}>
      {bgImage ? (
        <>
          <img
            src={bgImage}
            alt=""
            className="absolute inset-0 w-full h-full object-contain"
            referrerPolicy="no-referrer"
            onLoad={(e) => {
              const { naturalWidth, naturalHeight } = e.currentTarget;
              if (naturalWidth && naturalHeight) setCardAspect(naturalWidth / naturalHeight);
            }}
            onError={(e) => {
              if (!e.currentTarget.dataset.triedProxy) {
                e.currentTarget.dataset.triedProxy = "1";
                e.currentTarget.src = buildProxy(bgImage);
              }
            }}
          />
          <img
            src={cutoutImage}
            alt={altText}
            className={
              cutoutType === "base"
                ? "absolute left-1/2 top-[12%] -translate-x-1/2 w-[62%] h-[62%] object-contain"
                : "absolute inset-0 w-full h-full object-contain"
            }
            referrerPolicy="no-referrer"
            onError={(e) => {
              if (!e.currentTarget.dataset.triedProxy && cutoutImage) {
                e.currentTarget.dataset.triedProxy = "1";
                e.currentTarget.src = buildProxy(cutoutImage);
              }
            }}
          />

          {compact ? (
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 leading-none">
              <span className={`text-[9px] font-extrabold ${overlayTextClass}`}>{rating}</span>
            </div>
          ) : (
            <>
              <div className="absolute top-[22%] left-[18%] flex flex-col items-center leading-none">
                <span className={`text-xl font-extrabold ${overlayTextClass}`}>{rating}</span>
                <span className={`text-[10px] font-bold mt-0.5 ${overlayTextClass}`}>{position}</span>
              </div>

              <div className="absolute bottom-[13%] inset-x-0 px-7">
                <div className={`text-center text-sm font-bold truncate mb-0.5 ${overlayTextClass}`}>
                  {name}
                </div>
                {showStats && (
                  <>
                    <div className="grid grid-cols-6 gap-0.5 mb-0.5">
                      {[
                        ["PAC", stats?.pace],
                        ["SHO", stats?.shooting],
                        ["PAS", stats?.passing],
                        ["DRI", stats?.dribbling],
                        ["DEF", stats?.defending],
                        ["PHY", stats?.physicality],
                      ].map(([label, value]) => (
                        <div key={label} className="text-center leading-tight">
                          <div className={`text-[10px] font-extrabold ${overlayTextClass}`}>
                            {value || "-"}
                          </div>
                          <div className={`text-[6px] font-semibold ${overlayTextMutedClass}`}>{label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      {nationImage && (
                        <img src={nationImage} alt="" className="w-3 h-3 object-contain" referrerPolicy="no-referrer" />
                      )}
                      {leagueImage && (
                        <img src={leagueImage} alt="" className="w-3 h-3 object-contain" referrerPolicy="no-referrer" />
                      )}
                      {clubImage && (
                        <img src={clubImage} alt="" className="w-3 h-3 object-contain" referrerPolicy="no-referrer" />
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <img
            src={fallbackImage}
            alt={altText}
            className="absolute inset-0 w-full h-full object-contain"
            referrerPolicy="no-referrer"
            onError={(e) => {
              if (!e.currentTarget.dataset.triedProxy) {
                e.currentTarget.dataset.triedProxy = "1";
                e.currentTarget.src = buildProxy(fallbackImage);
              }
            }}
          />
          {/* No card template here to sit the plain centered-text badge
              against, so this gets its own small dark pill instead -
              still shows the rating even before card_bg_image/
              card_cutout_image are backfilled for a card. Shown in both
              compact and non-compact modes - a bare, unlabeled photo with
              nothing overlaid on it is a real regression, not a smaller
              version of the full card. */}
          {rating != null && (
            <div className="absolute top-1 left-1 bg-black/70 text-white leading-none px-1 py-0.5 rounded text-[9px] font-extrabold">
              {rating}
            </div>
          )}
          {!compact && name && (
            <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-center text-xs font-bold truncate px-1 py-1">
              {name}
            </div>
          )}
        </>
      )}
      {versionLabel && (
        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          {versionLabel}
        </div>
      )}
    </div>
  );
}
