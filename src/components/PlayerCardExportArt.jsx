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

// Measured directly from FUTBIN's live FC26 large-card DOM. The canonical
// composition is 252px wide, with a 350px background and a 354.8px wrapper.
// All coordinates below are in that exact coordinate system and scale
// linearly when a different export width is requested.
const BASE_WIDTH = 252;
const BASE_HEIGHT = 355;

export default function PlayerCardExportArt({
  width = BASE_WIDTH,
  height = BASE_HEIGHT,
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
  const scale = width / BASE_WIDTH;
  const px = (value) => Math.round(value * scale * 1000) / 1000;
  const isBase = cutoutType === "base";

  // Measured TOTW colour from the supplied computed styles. Base cards keep
  // their darker text fallback; special cards use the actual gold tone.
  const textColour = isBase ? "rgb(77, 51, 31)" : "rgb(223, 207, 154)";

  const statItems = [
    ["Pac", stats?.pace],
    ["Sho", stats?.shooting],
    ["Pas", stats?.passing],
    ["Dri", stats?.dribbling],
    ["Def", stats?.defending],
    ["Phy", stats?.physicality],
  ];

  if (!bgImage) {
    return (
      <div
        data-player-card-export
        className="relative overflow-visible"
        style={{ width, height, background: "transparent" }}
      >
        <img
          src={fallbackImage}
          alt={altText || name || "Player"}
          className="absolute left-0 top-0 block h-auto w-full"
          referrerPolicy="no-referrer"
          onError={proxyOnError(fallbackImage)}
        />
      </div>
    );
  }

  return (
    <div
      data-player-card-export
      className="relative overflow-visible"
      style={{
        width,
        height,
        background: "transparent",
        isolation: "isolate",
        color: textColour,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <img
        data-card-background
        src={bgImage}
        alt=""
        className="absolute left-0 top-0 block"
        style={{ zIndex: 1, width: px(252), height: px(350) }}
        referrerPolicy="no-referrer"
        onError={proxyOnError(bgImage)}
      />

      {cutoutImage && (
        <img
          data-card-player
          src={cutoutImage}
          alt={altText || name || "Player"}
          className="absolute block"
          style={
            isBase
              ? {
                  zIndex: 2,
                  left: px(55.4375),
                  top: px(61.725),
                  width: px(162),
                  height: px(162),
                  objectFit: "fill",
                }
              : {
                  zIndex: 2,
                  left: 0,
                  top: 0,
                  width: px(252),
                  height: px(349.675),
                }
          }
          referrerPolicy="no-referrer"
          onError={proxyOnError(cutoutImage)}
        />
      )}

      <div
        className="absolute text-center"
        style={{
          zIndex: 4,
          left: px(42.84),
          top: px(78.05),
          width: px(33.48),
          height: px(26.01),
          fontFamily: "Arial, sans-serif",
          fontSize: px(30),
          fontWeight: 700,
          lineHeight: `${px(26.0064)}px`,
          color: textColour,
        }}
      >
        {rating ?? "-"}
      </div>

      <div
        className="absolute text-center"
        style={{
          zIndex: 4,
          left: px(42.84),
          top: px(104.06),
          width: px(33.48),
          height: px(17.6),
          fontFamily: "Arial, sans-serif",
          fontSize: px(14.0364),
          fontWeight: 600,
          lineHeight: `${px(17.6)}px`,
          color: textColour,
        }}
      >
        {position || ""}
      </div>

      <div
        className="absolute flex flex-col items-center"
        style={{
          zIndex: 4,
          left: px(27.73),
          top: px(223.512),
          width: px(196.55),
          height: px(83.15),
          justifyContent: "space-evenly",
          color: textColour,
        }}
      >
        <div
          className="w-full truncate text-center"
          style={{
            height: px(25.2625),
            fontFamily: "Arial, sans-serif",
            fontSize: px(21.0546),
            fontWeight: 600,
            lineHeight: `${px(25.2655)}px`,
            letterSpacing: px(-0.2),
            textTransform: "capitalize",
          }}
        >
          {name}
        </div>

        <div
          className="flex w-full flex-row"
          style={{
            zIndex: 4,
            height: px(33.1),
            justifyContent: "space-evenly",
            textAlign: "center",
          }}
        >
          {statItems.map(([label, value]) => (
            <div
              key={label}
              className="relative flex flex-col-reverse"
              style={{
                minWidth: px(20.3),
                height: px(33.1),
                fontFamily: "Arial, sans-serif",
                color: textColour,
              }}
            >
              <div
                style={{
                  height: px(17.55),
                  marginTop: px(-2),
                  fontSize: px(16.8437),
                  fontWeight: 600,
                  lineHeight: `${px(17.5455)}px`,
                }}
              >
                {value ?? "-"}
              </div>
              <span
                style={{
                  height: px(17.55),
                  fontSize: px(12.9696),
                  fontWeight: 400,
                  lineHeight: `${px(17.5455)}px`,
                  textTransform: "uppercase",
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        <div
          className="relative flex items-center justify-between"
          style={{
            width: px(74),
            height: px(22),
          }}
        >
          {nationImage && (
            <img
              src={nationImage}
              alt=""
              className="block object-contain"
              style={{ width: px(22), height: px(22) }}
              referrerPolicy="no-referrer"
              onError={proxyOnError(nationImage)}
            />
          )}
          {leagueImage && (
            <img
              src={leagueImage}
              alt=""
              className="block object-contain"
              style={{ width: px(22), height: px(22) }}
              referrerPolicy="no-referrer"
              onError={proxyOnError(leagueImage)}
            />
          )}
          {clubImage && (
            <img
              src={clubImage}
              alt=""
              className="block object-contain"
              style={{ width: px(22), height: px(22) }}
              referrerPolicy="no-referrer"
              onError={proxyOnError(clubImage)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
