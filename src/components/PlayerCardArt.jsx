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

// Export mode renders at this fixed CSS-pixel width; every export-only
// font size/spacing value below is defined relative to it (see `scale`)
// so the exported PNG's proportions match this component's normal ~192px
// (w-48) on-screen rendering, just much crisper. 432x576 = a 0.75 aspect
// ratio (matches cardAspect's own pre-image-load default below) at close
// to a FUTBIN mobile standalone card export's ~435x576.
const EXPORT_BASE_WIDTH = 192;

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
  // Server-render-to-PNG mode (app/services/player_card_render.py screenshots
  // whatever this renders). Fixed pixel canvas instead of a Tailwind
  // widthClass + dynamic image-aspect box (deterministic sizing - the
  // export pipeline needs the same canvas size every time, not one that
  // shifts with whatever bgImage happens to load), every font/spacing
  // value scaled relative to EXPORT_BASE_WIDTH instead of Tailwind's fixed
  // px classes (which would render far too small at a 432px+ canvas), and
  // the additional fields (skill moves/weak foot/preferred foot/alt
  // positions) the on-screen card never had room for. Purely additive -
  // every existing call site leaves this false and is unaffected.
  exportMode = false,
  exportWidth = 432,
  exportHeight = 576,
  skillMoves,
  weakFoot,
  preferredFoot,
  altPositions,
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

  if (exportMode) {
    // Every fixed-px Tailwind utility below (text-xl, text-[10px], w-3,
    // px-7, ...) was tuned against a ~192px (w-48) on-screen card - at a
    // 432px+ export canvas those would render tiny relative to the card,
    // so exportMode recomputes each one as an inline style scaled by
    // `scale`. Percentage-based positioning classes (top-[22%], inset-0,
    // w-[62%], ...) already scale correctly on their own and are reused
    // as-is.
    const scale = exportWidth / EXPORT_BASE_WIDTH;
    const px = (base) => Math.round(base * scale * 100) / 100;
    // Long display names would otherwise overflow the fixed canvas width -
    // one step down keeps them on one line without shrinking every other
    // card's name unnecessarily.
    const nameFontSize = px((name?.length ?? 0) > 18 ? 12 : 14);

    return (
      <div
        data-player-card-export
        className="relative"
        style={{ width: exportWidth, height: exportHeight, background: "transparent" }}
      >
        {bgImage ? (
          <>
            <img
              src={bgImage}
              alt=""
              className="absolute inset-0 w-full h-full object-contain"
              referrerPolicy="no-referrer"
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

            {versionLabel && (
              <div
                className="absolute bg-black/70 text-white rounded"
                style={{ top: px(8), right: px(8), padding: `${px(4)}px ${px(8)}px`, fontSize: px(12) }}
              >
                {versionLabel}
              </div>
            )}

            <div
              className="absolute top-[22%] left-[18%] flex flex-col items-center leading-none"
              style={{ gap: px(2) }}
            >
              <span className={`font-extrabold ${overlayTextClass}`} style={{ fontSize: px(20) }}>{rating}</span>
              <span className={`font-bold ${overlayTextClass}`} style={{ fontSize: px(10) }}>{position}</span>
            </div>

            <div className="absolute bottom-[8%] inset-x-0" style={{ padding: `0 ${px(28)}px` }}>
              <div
                className={`text-center font-bold truncate ${overlayTextClass}`}
                style={{ fontSize: nameFontSize, marginBottom: px(2) }}
              >
                {name}
              </div>

              <div className="grid grid-cols-6" style={{ gap: px(2), marginBottom: px(3) }}>
                {[
                  ["PAC", stats?.pace],
                  ["SHO", stats?.shooting],
                  ["PAS", stats?.passing],
                  ["DRI", stats?.dribbling],
                  ["DEF", stats?.defending],
                  ["PHY", stats?.physicality],
                ].map(([label, value]) => (
                  <div key={label} className="text-center leading-tight">
                    <div className={`font-extrabold ${overlayTextClass}`} style={{ fontSize: px(10) }}>
                      {value || "-"}
                    </div>
                    <div className={`font-semibold ${overlayTextMutedClass}`} style={{ fontSize: px(6) }}>{label}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center" style={{ gap: px(4), marginBottom: px(4) }}>
                {nationImage && (
                  <img src={nationImage} alt="" className="object-contain" style={{ width: px(12), height: px(12) }} referrerPolicy="no-referrer" />
                )}
                {leagueImage && (
                  <img src={leagueImage} alt="" className="object-contain" style={{ width: px(12), height: px(12) }} referrerPolicy="no-referrer" />
                )}
                {clubImage && (
                  <img src={clubImage} alt="" className="object-contain" style={{ width: px(12), height: px(12) }} referrerPolicy="no-referrer" />
                )}
              </div>

              {/* Fields the on-screen card never had room for - export-only. */}
              {(skillMoves != null || weakFoot != null || preferredFoot) && (
                <div
                  className={`flex items-center justify-center font-semibold ${overlayTextMutedClass}`}
                  style={{ gap: px(6), fontSize: px(7), marginBottom: px(2) }}
                >
                  {skillMoves != null && <span>{"★".repeat(Math.max(0, Math.min(5, skillMoves)))} SM</span>}
                  {weakFoot != null && <span>{"★".repeat(Math.max(0, Math.min(5, weakFoot)))} WF</span>}
                  {preferredFoot && <span>{preferredFoot}</span>}
                </div>
              )}
              {altPositions?.length > 0 && (
                <div
                  className={`text-center font-semibold ${overlayTextMutedClass}`}
                  style={{ fontSize: px(7) }}
                >
                  {altPositions.join(" · ")}
                </div>
              )}
            </div>
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
            {rating != null && (
              <div
                className="absolute bg-black/70 text-white leading-none rounded font-extrabold"
                style={{ top: px(4), left: px(4), padding: `${px(2)}px ${px(4)}px`, fontSize: px(9) }}
              >
                {rating}
              </div>
            )}
            {name && (
              <div
                className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-center font-bold truncate"
                style={{ fontSize: px(12), padding: `${px(4)}px` }}
              >
                {name}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

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
