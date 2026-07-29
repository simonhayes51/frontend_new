import React from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";
const buildProxy = (url) => `${API_BASE}/img?url=${encodeURIComponent(url)}`;

// FUTBIN/Imgix URLs include a signature (`s=`) calculated from the complete
// query string. Changing `w` or any other parameter invalidates that
// signature and the CDN returns an error. Preserve signed URLs exactly as
// supplied. Only add a width to ordinary unsigned URLs.
function withWidth(url, width) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has("s") || parsed.searchParams.has("ixlib")) {
      return url;
    }
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

function nameSize(name) {
  const length = (name || "").length;
  if (length > 22) return 23;
  if (length > 18) return 26;
  if (length > 14) return 29;
  return 32;
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
  clubImage,
}) {
  const scale = width / 432;
  const px = (value) => Math.round(value * scale * 100) / 100;
  const isBase = cutoutType === "base";

  const primary = isBase ? "#2b210f" : "#f8efcf";
  const secondary = isBase ? "rgba(43,33,15,.82)" : "rgba(248,239,207,.88)";
  const divider = isBase ? "rgba(43,33,15,.42)" : "rgba(248,239,207,.42)";
  const shadow = isBase ? "0 1px 1px rgba(255,255,255,.55)" : "0 1px 3px rgba(0,0,0,.9)";

  if (!bgImage) {
    return (
      <div data-player-card-export className="relative overflow-hidden" style={{ width, height, background: "transparent" }}>
        <img
          src={withWidth(fallbackImage, 768)}
          alt={altText || name || "Player"}
          className="absolute inset-0 h-full w-full object-contain"
          referrerPolicy="no-referrer"
          onError={proxyOnError(fallbackImage)}
        />
      </div>
    );
  }

  const leftStats = [
    [stats?.pace, "PAC"],
    [stats?.shooting, "SHO"],
    [stats?.passing, "PAS"],
  ];
  const rightStats = [
    [stats?.dribbling, "DRI"],
    [stats?.defending, "DEF"],
    [stats?.physicality, "PHY"],
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
      <img
        src={withWidth(bgImage, 768)}
        alt=""
        className="absolute inset-0 h-full w-full object-contain"
        style={{ zIndex: 1 }}
        referrerPolicy="no-referrer"
        onError={proxyOnError(bgImage)}
      />

      {cutoutImage && (
        <img
          src={withWidth(cutoutImage, 768)}
          alt={altText || name || "Player"}
          className="absolute h-auto max-w-none object-contain"
          style={{
            zIndex: 2,
            width: isBase ? "77%" : "82%",
            right: isBase ? "0%" : "-1%",
            top: isBase ? "13.5%" : "12.5%",
            transformOrigin: "top right",
            filter: isBase ? "none" : "drop-shadow(0 5px 7px rgba(0,0,0,.2))",
          }}
          referrerPolicy="no-referrer"
          onError={proxyOnError(cutoutImage)}
        />
      )}

      <div
        className="absolute flex flex-col items-center leading-none"
        style={{
          zIndex: 4,
          top: "20.5%",
          left: "15.2%",
          width: "18%",
          color: primary,
          textShadow: shadow,
        }}
      >
        <div style={{ fontSize: px(50), lineHeight: 0.9, fontWeight: 800, letterSpacing: px(-2) }}>{rating ?? "-"}</div>
        <div style={{ marginTop: px(8), fontSize: px(21), lineHeight: 1, fontWeight: 700 }}>{position || ""}</div>

        <div className="flex flex-col items-center" style={{ marginTop: px(10), gap: px(7) }}>
          {nationImage && (
            <img
              src={withWidth(nationImage, 96)}
              alt=""
              className="object-contain"
              style={{ width: px(28), height: px(20) }}
              referrerPolicy="no-referrer"
              onError={proxyOnError(nationImage)}
            />
          )}
          {clubImage && (
            <img
              src={withWidth(clubImage, 96)}
              alt=""
              className="object-contain"
              style={{ width: px(29), height: px(29) }}
              referrerPolicy="no-referrer"
              onError={proxyOnError(clubImage)}
            />
          )}
        </div>
      </div>

      <div
        className="absolute inset-x-0"
        style={{
          zIndex: 5,
          top: "63.5%",
          padding: `0 ${px(78)}px`,
          color: primary,
          textShadow: shadow,
        }}
      >
        <div
          className="truncate text-center uppercase"
          style={{
            fontSize: px(nameSize(name)),
            lineHeight: 1,
            fontWeight: 700,
            letterSpacing: px(-0.45),
            marginBottom: px(12),
          }}
        >
          {name}
        </div>

        <div style={{ height: px(1), background: divider, margin: `0 ${px(15)}px ${px(10)}px` }} />

        <div className="relative grid grid-cols-2" style={{ padding: `0 ${px(16)}px`, columnGap: px(30) }}>
          <div
            className="absolute left-1/2 top-0 bottom-0"
            style={{ width: px(1), transform: "translateX(-50%)", background: divider }}
          />

          <div className="flex flex-col" style={{ gap: px(6) }}>
            {leftStats.map(([value, label]) => (
              <div key={label} className="flex items-baseline justify-center leading-none" style={{ gap: px(8) }}>
                <span style={{ minWidth: px(30), textAlign: "right", fontSize: px(23), fontWeight: 800 }}>{value ?? "-"}</span>
                <span style={{ minWidth: px(28), textAlign: "left", fontSize: px(14), fontWeight: 700, color: secondary }}>{label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col" style={{ gap: px(6) }}>
            {rightStats.map(([value, label]) => (
              <div key={label} className="flex items-baseline justify-center leading-none" style={{ gap: px(8) }}>
                <span style={{ minWidth: px(30), textAlign: "right", fontSize: px(23), fontWeight: 800 }}>{value ?? "-"}</span>
                <span style={{ minWidth: px(28), textAlign: "left", fontSize: px(14), fontWeight: 700, color: secondary }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
