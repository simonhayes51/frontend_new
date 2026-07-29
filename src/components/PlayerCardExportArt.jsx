import React from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";
const buildProxy = (url) => `${API_BASE}/img?url=${encodeURIComponent(url)}`;

function proxyOnError(originalUrl) {
  return (event) => {
    if (!originalUrl || event.currentTarget.dataset.triedProxy) return;
    event.currentTarget.dataset.triedProxy = "1";
    event.currentTarget.src = buildProxy(originalUrl);
  };
}

function clampStars(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(5, parsed)) : null;
}

function nameSize(name) {
  const length = (name || "").length;
  if (length > 24) return 23;
  if (length > 20) return 25;
  if (length > 16) return 28;
  return 31;
}

export default function PlayerCardExportArt({
  width = 432,
  height = 576,
  bgImage,
  cutoutImage,
  fallbackImage,
  cutoutType,
  rating,
  position,
  name,
  altText,
  stats,
  nationImage,
  leagueImage,
  clubImage,
  skillMoves,
  weakFoot,
  preferredFoot,
}) {
  const scale = width / 432;
  const px = (value) => Math.round(value * scale * 100) / 100;
  const isBase = cutoutType === "base";

  const primary = isBase ? "#201706" : "#fff8dc";
  const secondary = isBase ? "rgba(32,23,6,.78)" : "rgba(255,255,255,.88)";
  const textShadow = isBase
    ? "0 1px 2px rgba(255,255,255,.85)"
    : "0 2px 5px rgba(0,0,0,.95)";

  const sm = clampStars(skillMoves);
  const wf = clampStars(weakFoot);
  const foot = preferredFoot ? String(preferredFoot).trim().charAt(0).toUpperCase() : null;

  const statRows = [
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
        style={{ width, height, background: "transparent" }}
      >
        <img
          src={fallbackImage}
          alt={altText || name || "Player"}
          className="absolute inset-0 h-full w-full object-contain"
          referrerPolicy="no-referrer"
          onError={proxyOnError(fallbackImage)}
        />
      </div>
    );
  }

  return (
    <div
      data-player-card-export
      className="relative overflow-hidden"
      style={{
        width,
        height,
        background: "transparent",
        isolation: "isolate",
        fontFamily: "Inter, Arial, Helvetica, sans-serif",
      }}
    >
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 h-full w-full object-contain"
        style={{ zIndex: 1 }}
        referrerPolicy="no-referrer"
        onError={proxyOnError(bgImage)}
      />

      {cutoutImage && (
        <div
          className="absolute overflow-visible"
          style={{
            zIndex: 2,
            left: isBase ? "16%" : "7%",
            right: isBase ? "7%" : "1%",
            top: isBase ? "12%" : "8%",
            bottom: isBase ? "25%" : "21%",
          }}
        >
          <img
            src={cutoutImage}
            alt={altText || name || "Player"}
            className="absolute bottom-0 left-1/2 h-full w-auto max-w-none object-contain"
            style={{
              transform: `translateX(-50%) translateY(${isBase ? px(0) : px(8)}px) scale(${isBase ? 0.96 : 0.94})`,
              transformOrigin: "bottom center",
              filter: isBase ? "none" : "drop-shadow(0 8px 10px rgba(0,0,0,.42))",
            }}
            referrerPolicy="no-referrer"
            onError={proxyOnError(cutoutImage)}
          />
        </div>
      )}

      <div
        className="absolute inset-x-[8%] bottom-[6%] rounded-[28px]"
        style={{
          zIndex: 3,
          height: "43%",
          background: isBase
            ? "linear-gradient(to top, rgba(252,226,137,.70) 0%, rgba(252,226,137,.30) 48%, rgba(252,226,137,0) 100%)"
            : "linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.32) 50%, rgba(0,0,0,0) 100%)",
        }}
      />

      <div
        className="absolute flex flex-col items-center leading-none"
        style={{
          zIndex: 4,
          top: "21.5%",
          left: "15.5%",
          width: "20%",
          gap: px(4),
          color: primary,
          textShadow,
        }}
      >
        <span style={{ fontSize: px(56), fontWeight: 900, letterSpacing: px(-2.2) }}>{rating ?? "-"}</span>
        <span style={{ fontSize: px(25), fontWeight: 800, letterSpacing: px(-0.4) }}>{position || ""}</span>
      </div>

      <div
        className="absolute inset-x-0"
        style={{
          zIndex: 5,
          bottom: "7.2%",
          padding: `0 ${px(42)}px`,
          color: primary,
          textShadow,
        }}
      >
        <div
          className="truncate text-center"
          style={{
            fontSize: px(nameSize(name)),
            lineHeight: 1.02,
            fontWeight: 850,
            letterSpacing: px(-0.8),
            marginBottom: px(12),
          }}
        >
          {name}
        </div>

        <div className="grid grid-cols-6" style={{ columnGap: px(5), marginBottom: px(12) }}>
          {statRows.map(([label, value]) => (
            <div key={label} className="text-center leading-none">
              <div style={{ fontSize: px(24), fontWeight: 900, marginBottom: px(4) }}>{value ?? "-"}</div>
              <div style={{ fontSize: px(11), fontWeight: 800, color: secondary, letterSpacing: px(0.1) }}>{label}</div>
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
              onError={proxyOnError(nationImage)}
            />
          )}
          {leagueImage && (
            <img
              src={leagueImage}
              alt=""
              className="object-contain"
              style={{ width: px(34), height: px(34) }}
              referrerPolicy="no-referrer"
              onError={proxyOnError(leagueImage)}
            />
          )}
          {clubImage && (
            <img
              src={clubImage}
              alt=""
              className="object-contain"
              style={{ width: px(36), height: px(36) }}
              referrerPolicy="no-referrer"
              onError={proxyOnError(clubImage)}
            />
          )}
        </div>

        {(sm != null || wf != null || foot) && (
          <div
            className="flex items-center justify-center"
            style={{ gap: px(13), fontSize: px(13), lineHeight: 1, fontWeight: 800, color: secondary }}
          >
            {sm != null && <span>{sm}★ SM</span>}
            {wf != null && <span>{wf}★ WF</span>}
            {foot && <span>{foot}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
