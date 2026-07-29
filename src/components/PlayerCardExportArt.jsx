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

function nameSize(name) {
  const length = (name || "").length;
  if (length > 24) return 21;
  if (length > 20) return 23;
  if (length > 16) return 26;
  return 29;
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
}) {
  const scale = width / 432;
  const px = (value) => Math.round(value * scale * 100) / 100;
  const isBase = cutoutType === "base";

  const primary = isBase ? "#241a08" : "#fff7d6";
  const secondary = isBase ? "rgba(36,26,8,.82)" : "rgba(255,247,214,.9)";
  const shadow = isBase
    ? "0 1px 2px rgba(255,255,255,.75)"
    : "0 2px 4px rgba(0,0,0,.88)";

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
        fontFamily: "Arial Narrow, Inter, Arial, sans-serif",
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
            left: isBase ? "20%" : "18%",
            right: isBase ? "4%" : "2%",
            top: isBase ? "12%" : "13%",
            bottom: isBase ? "33%" : "32%",
          }}
        >
          <img
            src={cutoutImage}
            alt={altText || name || "Player"}
            className="absolute bottom-0 left-1/2 h-full w-auto max-w-none object-contain"
            style={{
              transform: `translateX(-50%) scale(${isBase ? 0.94 : 0.9})`,
              transformOrigin: "bottom center",
              filter: isBase ? "none" : "drop-shadow(0 5px 7px rgba(0,0,0,.28))",
            }}
            referrerPolicy="no-referrer"
            onError={proxyOnError(cutoutImage)}
          />
        </div>
      )}

      <div
        className="absolute flex flex-col items-center leading-none"
        style={{
          zIndex: 4,
          top: "21.5%",
          left: "16%",
          width: "18%",
          gap: px(5),
          color: primary,
          textShadow: shadow,
        }}
      >
        <span style={{ fontSize: px(54), fontWeight: 900, letterSpacing: px(-2.4) }}>{rating ?? "-"}</span>
        <span style={{ fontSize: px(23), fontWeight: 700 }}>{position || ""}</span>
      </div>

      <div
        className="absolute inset-x-0"
        style={{
          zIndex: 5,
          top: "64%",
          padding: `0 ${px(48)}px`,
          color: primary,
          textShadow: shadow,
        }}
      >
        <div
          className="truncate text-center"
          style={{
            fontSize: px(nameSize(name)),
            lineHeight: 1,
            fontWeight: 800,
            letterSpacing: px(-0.7),
            marginBottom: px(17),
          }}
        >
          {name}
        </div>

        <div className="grid grid-cols-6" style={{ columnGap: px(6), marginBottom: px(15) }}>
          {statRows.map(([label, value]) => (
            <div key={label} className="text-center leading-none">
              <div style={{ fontSize: px(22), fontWeight: 800, marginBottom: px(5) }}>{value ?? "-"}</div>
              <div style={{ fontSize: px(10), fontWeight: 700, color: secondary }}>{label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center" style={{ gap: px(15) }}>
          {nationImage && (
            <img
              src={nationImage}
              alt=""
              className="object-contain"
              style={{ width: px(31), height: px(31) }}
              referrerPolicy="no-referrer"
              onError={proxyOnError(nationImage)}
            />
          )}
          {leagueImage && (
            <img
              src={leagueImage}
              alt=""
              className="object-contain"
              style={{ width: px(31), height: px(31) }}
              referrerPolicy="no-referrer"
              onError={proxyOnError(leagueImage)}
            />
          )}
          {clubImage && (
            <img
              src={clubImage}
              alt=""
              className="object-contain"
              style={{ width: px(34), height: px(34) }}
              referrerPolicy="no-referrer"
              onError={proxyOnError(clubImage)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
