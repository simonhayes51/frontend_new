// src/components/PlayerCardArt.jsx
// Shared FUT-card rendering used by both the Player Search detail view and
// Player Compare. The export path deliberately uses its own deterministic
// composition while continuing to share the same data and source artwork.
import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";
const buildProxy = (url) => `${API_BASE}/img?url=${encodeURIComponent(url)}`;

const EXPORT_BASE_WIDTH = 432;

function imageErrorFallback(originalUrl) {
  return (event) => {
    if (!event.currentTarget.dataset.triedProxy && originalUrl) {
      event.currentTarget.dataset.triedProxy = "1";
      event.currentTarget.src = buildProxy(originalUrl);
    }
  };
}

function ExportCard({
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
  altText,
  exportWidth,
  exportHeight,
  skillMoves,
  weakFoot,
  preferredFoot,
}) {
  const scale = exportWidth / EXPORT_BASE_WIDTH;
  const px = (value) => Math.round(value * scale * 100) / 100;
  const isBase = cutoutType === "base";
  const textColour = isBase ? "#241b0c" : "#fffbe8";
  const mutedColour = isBase ? "rgba(36,27,12,.82)" : "rgba(255,255,255,.88)";
  const shadow = isBase
    ? "0 1px 2px rgba(255,255,255,.8)"
    : "0 2px 4px rgba(0,0,0,.9)";

  const displayName = name || "";
  const nameSize = displayName.length > 20 ? 24 : displayName.length > 16 ? 27 : 31;
  const sm = Number.isFinite(Number(skillMoves)) ? Math.max(0, Math.min(5, Number(skillMoves))) : null;
  const wf = Number.isFinite(Number(weakFoot)) ? Math.max(0, Math.min(5, Number(weakFoot))) : null;
  const shortFoot = preferredFoot ? String(preferredFoot).trim().charAt(0).toUpperCase() : null;

  const statItems = [
    ["PAC", stats?.pace],
    ["SHO", stats?.shooting],
    ["PAS", stats?.passing],
    ["DRI", stats?.dribbling],
    ["DEF", stats?.defending],
    ["PHY", stats?.physicality],
  ];

  if (!bgImage) {
    return (
      <div
        data-player-card-export
        className="relative overflow-hidden"
        style={{ width: exportWidth, height: exportHeight, background: "transparent" }}
      >
        <img
          src={fallbackImage}
          alt={altText}
          className="absolute inset-0 h-full w-full object-contain"
          referrerPolicy="no-referrer"
          onError={imageErrorFallback(fallbackImage)}
        />
        {rating != null && (
          <div
            className="absolute rounded bg-black/75 font-extrabold leading-none text-white"
            style={{ top: px(12), left: px(12), padding: `${px(6)}px ${px(10)}px`, fontSize: px(30) }}
          >
            {rating}
          </div>
        )}
        {displayName && (
          <div
            className="absolute inset-x-0 bottom-0 truncate bg-black/75 text-center font-bold text-white"
            style={{ padding: px(12), fontSize: px(24) }}
          >
            {displayName}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      data-player-card-export
      className="relative overflow-hidden"
      style={{
        width: exportWidth,
        height: exportHeight,
        background: "transparent",
        isolation: "isolate",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 h-full w-full object-contain"
        style={{ zIndex: 1 }}
        referrerPolicy="no-referrer"
        onError={imageErrorFallback(bgImage)}
      />

      <div
        className="absolute overflow-visible"
        style={{
          zIndex: 2,
          left: isBase ? "16%" : "7%",
          right: isBase ? "7%" : "1%",
          top: isBase ? "12%" : "8%",
          bottom: isBase ? "24%" : "20%",
        }}
      >
        <img
          src={cutoutImage}
          alt={altText}
          className="absolute left-1/2 bottom-0 h-full w-auto max-w-none object-contain"
          style={{
            transform: `translateX(-50%) translateY(${isBase ? px(2) : px(8)}px) scale(${isBase ? 0.96 : 0.94})`,
            transformOrigin: "bottom center",
          }}
          referrerPolicy="no-referrer"
          onError={imageErrorFallback(cutoutImage)}
        />
      </div>

      <div
        className="absolute inset-x-[8%] bottom-[7%] rounded-[28px]"
        style={{
          zIndex: 3,
          height: "43%",
          background: isBase
            ? "linear-gradient(to top, rgba(255,238,174,.72) 0%, rgba(255,238,174,.30) 45%, rgba(255,238,174,0) 100%)"
            : "linear-gradient(to top, rgba(0,0,0,.66) 0%, rgba(0,0,0,.28) 50%, rgba(0,0,0,0) 100%)",
          filter: "blur(0.1px)",
        }}
      />

      <div
        className="absolute flex flex-col items-center leading-none"
        style={{ zIndex: 4, top: "22%", left: "17%", width: "18%", gap: px(5), color: textColour, textShadow: shadow }}
      >
        <span style={{ fontSize: px(54), fontWeight: 900, letterSpacing: px(-2) }}>{rating ?? "-"}</span>
        <span style={{ fontSize: px(25), fontWeight: 800 }}>{position || ""}</span>
      </div>

      <div
        className="absolute inset-x-0"
        style={{ zIndex: 5, bottom: "7.5%", padding: `0 ${px(44)}px`, color: textColour, textShadow: shadow }}
      >
        <div
          className="truncate text-center"
          style={{
            fontSize: px(nameSize),
            lineHeight: 1.05,
            fontWeight: 850,
            letterSpacing: px(-0.7),
            marginBottom: px(12),
          }}
        >
          {displayName}
        </div>

        <div
          className="grid grid-cols-6"
          style={{ columnGap: px(5), marginBottom: px(12) }}
        >
          {statItems.map(([label, value]) => (
            <div key={label} className="text-center leading-none">
              <div style={{ fontSize: px(24), fontWeight: 900, marginBottom: px(4) }}>{value ?? "-"}</div>
              <div style={{ fontSize: px(11), fontWeight: 800, color: mutedColour, letterSpacing: px(0.2) }}>{label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center" style={{ gap: px(15), marginBottom: px(10) }}>
          {nationImage && (
            <img
              src={nationImage}
              alt=""
              className="object-contain"
              style={{ width: px(34), height: px(34) }}
              referrerPolicy="no-referrer"
              onError={imageErrorFallback(nationImage)}
            />
          )}
          {leagueImage && (
            <img
              src={leagueImage}
              alt=""
              className="object-contain"
              style={{ width: px(34), height: px(34) }}
              referrerPolicy="no-referrer"
              onError={imageErrorFallback(leagueImage)}
            />
          )}
          {clubImage && (
            <img
              src={clubImage}
              alt=""
              className="object-contain"
              style={{ width: px(36), height: px(36) }}
              referrerPolicy="no-referrer"
              onError={imageErrorFallback(clubImage)}
            />
          )}
        </div>

        {(sm != null || wf != null || shortFoot) && (
          <div
            className="flex items-center justify-center"
            style={{ gap: px(13), fontSize: px(13), lineHeight: 1, fontWeight: 800, color: mutedColour }}
          >
            {sm != null && <span>{sm}★ SM</span>}
            {wf != null && <span>{wf}★ WF</span>}
            {shortFoot && <span>{shortFoot}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

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
  compact = false,
  showStats = true,
  exportMode = false,
  exportWidth = 432,
  exportHeight = 576,
  skillMoves,
  weakFoot,
  preferredFoot,
  altPositions,
}) {
  const [cardAspect, setCardAspect] = useState(0.75);

  const overlayTextClass =
    cutoutType === "base"
      ? "text-black [text-shadow:0_1px_2px_rgba(255,255,255,0.85)]"
      : "text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]";
  const overlayTextMutedClass =
    cutoutType === "base"
      ? "text-black/80 [text-shadow:0_1px_2px_rgba(255,255,255,0.85)]"
      : "text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]";

  if (exportMode) {
    return (
      <ExportCard
        bgImage={bgImage}
        cutoutImage={cutoutImage}
        cutoutType={cutoutType}
        fallbackImage={fallbackImage}
        rating={rating}
        position={position}
        name={name}
        stats={stats}
        nationImage={nationImage}
        leagueImage={leagueImage}
        clubImage={clubImage}
        altText={altText}
        exportWidth={exportWidth}
        exportHeight={exportHeight}
        skillMoves={skillMoves}
        weakFoot={weakFoot}
        preferredFoot={preferredFoot}
      />
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
            onError={imageErrorFallback(bgImage)}
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
            onError={imageErrorFallback(cutoutImage)}
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
            onError={imageErrorFallback(fallbackImage)}
          />
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
