import React from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";
const buildProxy = (url) => `${API_BASE}/img?url=${encodeURIComponent(url)}`;

function assetUrl(url, width) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has("s") || parsed.searchParams.has("ixlib")) return url;
    parsed.searchParams.set("fm", "png");
    parsed.searchParams.set("w", String(width));
    return parsed.toString();
  } catch {
    return url;
  }
}

function proxyOnError(originalUrl) {
  return (event) => {
    if (!originalUrl || event.currentTarget.dataset.triedProxy) return;
    event.currentTarget.dataset.triedProxy = "1";
    event.currentTarget.src = buildProxy(originalUrl);
  };
}

function displayNameSize(name) {
  const length = (name || "").length;
  if (length > 22) return 19;
  if (length > 18) return 21;
  if (length > 14) return 23;
  return 25;
}

function HexBadge({ children, width, height, style }) {
  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        clipPath: "polygon(50% 0%, 92% 24%, 92% 76%, 50% 100%, 8% 76%, 8% 24%)",
        background: "#17150f",
        boxShadow: "inset 0 0 0 1px #e3c95c",
        color: "#fff4bf",
        fontWeight: 800,
        ...style,
      }}
    >
      {children}
    </div>
  );
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
  altPositions = [],
  skillMoves,
  weakFoot,
  preferredFoot,
  futbinRating,
}) {
  const scale = width / 432;
  const px = (value) => Math.round(value * scale * 100) / 100;
  const isBase = cutoutType === "base";
  const primary = isBase ? "#2b210f" : "#fff2bd";
  const shadow = isBase ? "0 1px 1px rgba(255,255,255,.55)" : "0 1px 3px rgba(0,0,0,.95)";

  if (!bgImage) {
    return (
      <div data-player-card-export className="relative overflow-hidden" style={{ width, height, background: "transparent" }}>
        <img
          src={assetUrl(fallbackImage, 768)}
          alt={altText || name || "Player"}
          className="absolute inset-0 h-full w-full object-contain"
          referrerPolicy="no-referrer"
          onError={proxyOnError(fallbackImage)}
        />
      </div>
    );
  }

  const cardWidth = px(360);
  const cardHeight = px(500);
  const left = (width - cardWidth) / 2;
  const top = px(22);
  const sm = Number.isFinite(Number(skillMoves)) ? Number(skillMoves) : null;
  const wf = Number.isFinite(Number(weakFoot)) ? Number(weakFoot) : null;
  const foot = preferredFoot ? String(preferredFoot).trim().charAt(0).toUpperCase() : null;
  const alt = altPositions?.[0] || null;

  const statItems = [
    ["PAC", stats?.pace],
    ["SHO", stats?.shooting],
    ["PAS", stats?.passing],
    ["DRI", stats?.dribbling],
    ["DEF", stats?.defending],
    ["PHY", stats?.physicality],
  ];

  return (
    <div
      data-player-card-export
      className="relative overflow-hidden"
      style={{
        width,
        height,
        background: "transparent",
        isolation: "isolate",
        fontFamily: "Arial Narrow, Roboto Condensed, Inter, Arial, sans-serif",
      }}
    >
      <div className="absolute" style={{ left, top, width: cardWidth, height: cardHeight }}>
        <img
          src={assetUrl(bgImage, 768)}
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
          style={{ zIndex: 1 }}
          referrerPolicy="no-referrer"
          onError={proxyOnError(bgImage)}
        />

        {cutoutImage && (
          <img
            src={assetUrl(cutoutImage, 768)}
            alt={altText || name || "Player"}
            className="absolute h-auto max-w-none object-contain"
            style={{
              zIndex: 2,
              width: isBase ? "73%" : "76%",
              right: isBase ? "4%" : "1%",
              top: isBase ? "8.5%" : "7.5%",
              filter: isBase ? "none" : "drop-shadow(0 4px 6px rgba(0,0,0,.18))",
            }}
            referrerPolicy="no-referrer"
            onError={proxyOnError(cutoutImage)}
          />
        )}

        <div
          className="absolute flex flex-col items-center leading-none"
          style={{
            zIndex: 4,
            top: "13.5%",
            left: "9.5%",
            width: "22%",
            color: primary,
            textShadow: shadow,
          }}
        >
          <div style={{ fontSize: px(41), lineHeight: 0.9, fontWeight: 900, letterSpacing: px(-1.8) }}>{rating ?? "-"}</div>
          <div style={{ marginTop: px(8), fontSize: px(17), fontWeight: 800 }}>{position || ""}</div>
          <div style={{ marginTop: px(2), fontSize: px(11), fontWeight: 900 }}>++</div>
        </div>

        {alt && (
          <div className="absolute" style={{ zIndex: 6, top: "18%", right: "2.5%" }}>
            <HexBadge width={px(48)} height={px(43)} style={{ fontSize: px(14) }}>{alt}</HexBadge>
          </div>
        )}

        <div
          className="absolute inset-x-0"
          style={{
            zIndex: 5,
            top: "59.5%",
            padding: `0 ${px(46)}px`,
            color: primary,
            textShadow: shadow,
          }}
        >
          <div
            className="truncate text-center"
            style={{
              fontSize: px(displayNameSize(name)),
              lineHeight: 1,
              fontWeight: 800,
              letterSpacing: px(-0.45),
              marginBottom: px(8),
            }}
          >
            {name}
          </div>

          <div className="grid grid-cols-6" style={{ columnGap: px(3), marginBottom: px(8) }}>
            {statItems.map(([label, value]) => (
              <div key={label} className="text-center leading-none">
                <div style={{ fontSize: px(11), fontWeight: 800, marginBottom: px(3) }}>{label}</div>
                <div style={{ fontSize: px(18), fontWeight: 900 }}>{value ?? "-"}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center" style={{ gap: px(8) }}>
            {nationImage && (
              <img
                src={assetUrl(nationImage, 96)}
                alt=""
                className="object-contain"
                style={{ width: px(25), height: px(18) }}
                referrerPolicy="no-referrer"
                onError={proxyOnError(nationImage)}
              />
            )}
            {leagueImage && (
              <img
                src={assetUrl(leagueImage, 96)}
                alt=""
                className="object-contain"
                style={{ width: px(23), height: px(23) }}
                referrerPolicy="no-referrer"
                onError={proxyOnError(leagueImage)}
              />
            )}
            {clubImage && (
              <img
                src={assetUrl(clubImage, 96)}
                alt=""
                className="object-contain"
                style={{ width: px(25), height: px(25) }}
                referrerPolicy="no-referrer"
                onError={proxyOnError(clubImage)}
              />
            )}
          </div>
        </div>

        <div
          className="absolute flex items-center justify-center"
          style={{ zIndex: 7, left: "27%", right: "18%", bottom: "1%", gap: px(4) }}
        >
          {foot && <HexBadge width={px(27)} height={px(24)} style={{ fontSize: px(12) }}>{foot}</HexBadge>}
          {sm != null && <HexBadge width={px(38)} height={px(24)} style={{ fontSize: px(11) }}>{sm}★</HexBadge>}
          {wf != null && <HexBadge width={px(38)} height={px(24)} style={{ fontSize: px(11) }}>{wf}★</HexBadge>}
          {futbinRating != null && (
            <div
              style={{
                height: px(24),
                padding: `0 ${px(7)}px`,
                display: "flex",
                alignItems: "center",
                borderRadius: px(3),
                background: "#2bdc9c",
                color: "#081b15",
                fontWeight: 900,
                fontSize: px(11),
              }}
            >
              {Number(futbinRating).toFixed(1)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
