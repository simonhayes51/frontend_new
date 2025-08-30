// src/components/PlayerSearch.jsx
import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Search, TrendingUp, TrendingDown, Minus, Loader2, Target } from "lucide-react";
import PriceTrendChart from "./PriceTrendChart.jsx"; // ← the new chart

const API_BASE = import.meta.env.VITE_API_URL || "";
const buildProxy = (url) => `${API_BASE}/img?url=${encodeURIComponent(url)}`;
const PLACEHOLDER = "/img/card-placeholder.png"; // used when an image is missing

// ------- backend helpers -------
const searchPlayers = async (query) => {
  if (!query.trim()) return [];
  try {
    const r = await fetch(`${API_BASE}/api/search-players?q=${encodeURIComponent(query)}`, {
      credentials: "include",
    });
    if (!r.ok) return [];
    const data = await r.json();
    return data.players || [];
  } catch (e) {
    console.error("Search failed:", e);
    return [];
  }
};

const addToWatchlist = async ({ player_name, card_id, version, platform, notes }) => {
  const r = await fetch(`${API_BASE}/api/watchlist`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player_name, card_id, version, platform, notes }),
  });
  let payload = null;
  try {
    payload = await r.json();
  } catch {}
  if (!r.ok) {
    const msg = payload?.detail || "Failed to add to watchlist";
    throw new Error(msg);
  }
  return payload;
};

const fetchPlayerDefinition = async (cardId) => {
  try {
    const response = await fetch(`${API_BASE}/api/fut-player-definition/${cardId}`, {
      credentials: "include",
    });
    if (response.ok) {
      const data = await response.json();
      return data.data;
    }
  } catch (error) {
    console.error("Failed to fetch player definition:", error);
  }
  return null;
};

const fetchPlayerPrice = async (cardId) => {
  try {
    const response = await fetch(`${API_BASE}/api/fut-player-price/${cardId}`, {
      credentials: "include",
    });
    if (response.ok) {
      const data = await response.json();
      return {
        current: data.data?.currentPrice?.price || null,
        isExtinct: data.data?.currentPrice?.isExtinct || false,
        updatedAt: data.data?.currentPrice?.priceUpdatedAt || null,
        auctions: data.data?.completedAuctions || [],
      };
    }
  } catch (error) {
    console.error("Failed to fetch price:", error);
  }
  return null;
};

// ------- position helpers -------
const POS_CODE_TO_NAME = {
  0: "GK", 1: "GK", 2: "GK",
  3: "RB", 4: "RB",
  5: "CB", 6: "CB",
  7: "LB", 8: "LB", 9: "LB",
  10: "CDM", 11: "CDM",
  12: "RM", 13: "RM",
  14: "CM", 15: "CM",
  16: "LM", 17: "LM",
  18: "CAM", 19: "CAM", 20: "CAM", 21: "CAM", 22: "CAM",
  23: "RW", 24: "RW",
  25: "ST", 26: "ST",
  27: "LW",
};
const getPositionName = (id) => POS_CODE_TO_NAME[id] || "Unknown";

const _posNorm = (x) => {
  if (x == null) return null;
  if (typeof x === "number") return getPositionName(x);
  if (typeof x === "string") {
    const s = x.trim().toUpperCase();
    if (!s) return null;
    return s.split(/[,\|/]+/)[0]?.trim() || null;
  }
  if (Array.isArray(x)) {
    for (const v of x) {
      const t = _posNorm(v);
      if (t) return t;
    }
    return null;
  }
  if (typeof x === "object") {
    return (
      _posNorm(x.name) ||
      _posNorm(x.shortName) ||
      _posNorm(x.short) ||
      _posNorm(x.code) ||
      _posNorm(x.position) ||
      _posNorm(x.id)
    );
  }
  return null;
};

const resolvePosition = (pd, fb) => {
  const cands = [
    pd?.position, pd?.preferredPosition1, pd?.preferredPosition2, pd?.preferredPosition3,
    pd?.mainPosition, pd?.primaryPosition, pd?.bestPosition, pd?.basePosition, pd?.defaultPosition,
    pd?.positionId, pd?.positionName, pd?.preferredPosition1Name, pd?.shortPosition, pd?.positionShort,
    pd?.positionFull, pd?.positionLong, pd?.positions, pd?.preferredPositions, pd?.alternativePositions,
    pd?.altPositions, pd?.playablePositions, pd?.positionsList, pd?.positionList, pd?.displayPositions,
    fb?.position, fb?.position_name, fb?.position_short, fb?.pos, fb?.positions,
  ];
  for (const c of cands) {
    const t = _posNorm(c);
    if (t) return t;
  }
  return "Unknown";
};

const getAttributeColor = (v) =>
  v >= 90 ? "text-green-400" :
  v >= 80 ? "text-green-300" :
  v >= 70 ? "text-yellow-300" :
  v >= 60 ? "text-orange-300" : "text-red-400";

// ================== AutoFitNumber (shrinks to fit) ==================
function AutoFitNumber({ value, className = "" }) {
  const spanRef = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    const recalc = () => {
      const cs = getComputedStyle(parent);
      const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      const icon = parent.querySelector("img");
      const iconW = icon ? icon.getBoundingClientRect().width : 20;
      const gap =  (parseFloat(cs.columnGap) || 0) || 8;
      const safety = 6;

      const available = Math.max(0, parent.clientWidth - pad - iconW - gap - safety);
      el.style.transform = "scale(1)";
      const needed = el.scrollWidth || 1;

      const next = Math.min(1, Math.max(0.4, available / needed));
      setScale(next);
    };

    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(parent);
    window.addEventListener("resize", recalc);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recalc);
    };
  }, [value]);

  return (
    <span
      ref={spanRef}
      className={className}
      style={{
        display: "inline-block",
        transform: `scale(${scale})`,
        transformOrigin: "left center",
        whiteSpace: "nowrap",
        lineHeight: 1,
      }}
    >
      {value != null ? Number(value).toLocaleString() : "N/A"}
    </span>
  );
}

// ================== SearchBox ==================
const SearchBox = ({ onPlayerSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        setShowResults(false);
        return;
      }
      setLoading(true);
      const players = await searchPlayers(query);
      setResults(players);
      setLoading(false);
      setShowResults(true);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
        )}
        <input
          type="text"
          placeholder="Search players (e.g. Messi, Mbappé)..."
          className="w-full pl-10 pr-4 py-3 bg-[#1e293b] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-lg text-white placeholder-gray-400"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
        />
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-[#1e293b] border border-gray-600 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.map((player) => (
            <button
              key={`${player.card_id}-${player.rating}`}
              className="w-full px-4 py-3 text-left hover:bg-[#334155] border-b border-gray-700 last:border-b-0 focus:outline-none focus:bg-blue-500/20"
              onClick={() => {
                onPlayerSelect(player);
                setShowResults(false);
                setQuery("");
              }}
            >
              <div className="flex items-center gap-3">
                <img
                  src={player.image_url || PLACEHOLDER}
                  alt={`${player.name} (${player.rating})`}
                  loading="lazy"
                  className="w-12 h-16 object-contain"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.dataset.triedProxy && player.image_url) {
                      img.dataset.triedProxy = "1";
                      img.src = buildProxy(player.image_url);
                    } else {
                      img.src = PLACEHOLDER;
                    }
                  }}
                  referrerPolicy="no-referrer"
                />
                <div className="font-semibold text-white truncate">
                  {player.name} ({player.rating})
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && !loading && query && results.length === 0 && (
        <div className="absolute z-10 w-full mt-2 bg-[#1e293b] border border-gray-600 rounded-lg shadow-lg p-4 text-center text-gray-400">
          No players found for "{query}"
        </div>
      )}
    </div>
  );
};

// ================== PriceTrend ==================
const PriceTrend = ({ auctions }) => {
  if (!auctions || auctions.length < 2) return null;
  const [a, b] = auctions.slice(0, 2);
  const cur = a?.soldPrice;
  const prev = b?.soldPrice;
  if (!cur || !prev) return null;

  const change = cur - prev;
  const pct = ((change / prev) * 100).toFixed(2);

  return (
    <div className="flex items-center gap-2 text-sm">
      {change > 0 ? (
        <TrendingUp className="w-4 h-4 text-green-500" />
      ) : change < 0 ? (
        <TrendingDown className="w-4 h-4 text-red-500" />
      ) : (
        <Minus className="w-4 h-4 text-gray-400" />
      )}
      <span className={`font-medium ${change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-gray-600"}`}>
        {pct}% {change > 0 ? `(+${change.toLocaleString()})` : `(${change.toLocaleString()})`}
      </span>
    </div>
  );
};

// ================== PlayerDetail ==================
const PlayerDetail = ({ player, onBack }) => {
  const [priceData, setPriceData] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [adding, setAdding] = useState(false);
  const [platform, setPlatform] = useState("ps");
  const [notes, setNotes] = useState("");

  const cardId = player.card_id || player.id;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [priceInfo, defInfo] = await Promise.all([
        fetchPlayerPrice(cardId),
        fetchPlayerDefinition(cardId),
      ]);
      setPriceData(priceInfo);
      setPlayerData(defInfo);
      setLoading(false);
    })();
  }, [cardId]);

  const formatPrice = (p) => (p ? p.toLocaleString() : "N/A");

  const priceRange =
    priceData?.auctions?.length
      ? (() => {
          const prices = priceData.auctions.map((a) => a.soldPrice).filter(Boolean);
          if (!prices.length) return null;
          return { min: Math.min(...prices), max: Math.max(...prices) };
        })()
      : null;

  const d = {
    fullName:
      playerData?.commonName ||
      (playerData?.firstName && playerData?.lastName
        ? `${playerData.firstName} ${playerData.lastName}`
        : `${player.name} (${player.rating})`),
    position: resolvePosition(playerData, player),
    club: playerData?.club?.name || player.club || "Unknown",
    clubImage: playerData?.club?.imagePath
      ? `https://game-assets.fut.gg/cdn-cgi/image/quality=100,format=auto,width=40/${playerData.club.imagePath}`
      : "",
    nation: playerData?.nation?.name || player.nation || "Unknown",
    nationImage: playerData?.nation?.imagePath
      ? `https://game-assets.fut.gg/cdn-cgi/image/quality=100,format=auto,width=40/${playerData.nation.imagePath}`
      : "",
    league: playerData?.league?.name || "Unknown League",
    leagueImage: playerData?.league?.imagePath
      ? `https://game-assets.fut.gg/cdn-cgi/image/quality=100,format=auto,width=40/${playerData.league.imagePath}`
      : "",
    cardImage: playerData?.futggCardImagePath
      ? `https://game-assets.fut.gg/cdn-cgi/image/quality=90,format=auto,width=500/${playerData.futggCardImagePath}`
      : player.image_url,
    rating: playerData?.overall ?? player.rating,
    version: playerData?.rarity?.name || player.version || "Base",
    skillMoves: playerData?.skillMoves ?? 3,
    weakFoot: playerData?.weakFoot ?? 3,
    age: playerData?.dateOfBirth
      ? new Date().getFullYear() - new Date(playerData.dateOfBirth).getFullYear()
      : null,
    foot: playerData?.foot === 2 ? "Left" : "Right",
    accelerateType: playerData?.accelerateType || "Controlled",
    stats: {
      pace: playerData?.facePace || 0,
      shooting: playerData?.faceShooting || 0,
      passing: playerData?.facePassing || 0,
      dribbling: playerData?.faceDribbling || 0,
      defending: playerData?.faceDefending || 0,
      physicality: playerData?.facePhysicality || 0,
    },
    attributes: {
      acceleration: playerData?.attributeAcceleration || 0,
      sprintSpeed: playerData?.attributeSprintSpeed || 0,
      agility: playerData?.attributeAgility || 0,
      balance: playerData?.attributeBalance || 0,
      jumping: playerData?.attributeJumping || 0,
      stamina: playerData?.attributeStamina || 0,
      strength: playerData?.attributeStrength || 0,
      reactions: playerData?.attributeReactions || 0,
      aggression: playerData?.attributeAggression || 0,
      composure: playerData?.attributeComposure || 0,
      interceptions: playerData?.attributeInterceptions || 0,
      positioning: playerData?.attributePositioning || 0,
      vision: playerData?.attributeVision || 0,
      ballControl: playerData?.attributeBallControl || 0,
      crossing: playerData?.attributeCrossing || 0,
      dribbling: playerData?.attributeDribbling || 0,
      finishing: playerData?.attributeFinishing || 0,
      freeKickAccuracy: playerData?.attributeFkAccuracy || 0,
      headingAccuracy: playerData?.attributeHeadingAccuracy || 0,
      longPassing: playerData?.attributeLongPassing || 0,
      shortPassing: playerData?.attributeShortPassing || 0,
      shotPower: playerData?.attributeShotPower || 0,
      longShots: playerData?.attributeLongShots || 0,
      standingTackle: playerData?.attributeStandingTackle || 0,
      slidingTackle: playerData?.attributeSlidingTackle || 0,
      volleys: playerData?.attributeVolleys || 0,
      curve: playerData?.attributeCurve || 0,
      penalties: playerData?.attributePenalties || 0,
    },
  };

  const onAddClick = async () => {
    try {
      setAdding(true);
      await addToWatchlist({
        player_name: player.name,
        card_id: Number(cardId),
        version: player.version || playerData?.rarity?.name || null,
        platform,
        notes: notes?.trim() || null,
      });
      alert(`Added ${player.name} to your watchlist ✓`);
      setNotes("");
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to add to watchlist");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-[#0f172a]">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 text-blue-400 hover:text-blue-300 font-medium transition-colors"
      >
        ← Back to Search
      </button>

      <div className="bg-[#1e293b] border border-gray-700 text-white rounded-xl p-6">
        <div className="flex flex-col lg:flex-row items-start gap-6 mb-6">
          <div className="relative">
            <img
              src={d.cardImage}
              alt={d.fullName}
              className="w-48 h-64 object-cover rounded-lg"
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (!e.target.dataset.triedProxy) {
                  e.target.dataset.triedProxy = "1";
                  e.target.src = buildProxy(d.cardImage);
                }
              }}
            />
            <div className="absolute top-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-xs">
              {d.version}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="mb-2 font-extrabold leading-tight tracking-tight break-words text-3xl sm:text-4xl md:text-5xl">
              {d.fullName}
            </h1>

            {/* Price / Range / Trend / AcceleRATE */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Price */}
              <div className="bg-[#334155] rounded-lg p-3 min-w-0">
                <div className="text-gray-300 text-xs md:text-sm mb-1">Price</div>
                <div className="font-bold text-yellow-400 leading-tight">
                  {loading ? (
                    <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin inline align-[-2px]" />
                  ) : priceData?.isExtinct ? (
                    "Extinct"
                  ) : (
                    <span className="inline-flex items-center gap-2 min-w-0 overflow-hidden align-middle w-full">
                      <img
                        src="https://cdn2.futbin.com/https%3A%2F%2Fcdn.futbin.com%2Fdesign%2Fimg%2Fcoins_big.png?fm=png&ixlib=java-2.1.0&w=40&s=cad4ceb684da7f0b778fdeb1d4065fb1"
                        alt="Coins"
                        className="w-4 h-4 md:w-5 md:h-5 shrink-0"
                      />
                      <AutoFitNumber value={priceData?.current} />
                    </span>
                  )}
                </div>
              </div>

              {/* Range */}
              <div className="bg-[#334155] rounded-lg p-3 min-w-0">
                <div className="text-gray-300 text-xs md:text-sm mb-1">Range</div>
                <div className="font-medium leading-snug text-sm md:text-base break-words">
                  {priceRange ? `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}` : "N/A"}
                </div>
              </div>

              {/* Trend */}
              <div className="bg-[#334155] rounded-lg p-3 min-w-0">
                <div className="text-gray-300 text-xs md:text-sm mb-1">Trend</div>
                <PriceTrend auctions={priceData?.auctions} />
              </div>

              {/* AcceleRATE */}
              <div className="bg-[#334155] rounded-lg p-3 min-w-0">
                <div className="text-gray-300 text-xs md:text-sm mb-1">AcceleRATE</div>
                <div className="font-semibold text-green-400 text-sm md:text-base leading-tight">
                  {d.accelerateType.replace(/_/g, " ")}
                </div>
              </div>
            </div>

            {/* Club / Nation / League / Position */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Club */}
              <div className="text-center bg-[#334155] rounded-lg p-3">
                <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                  {d.clubImage ? (
                    <img
                      src={d.clubImage}
                      alt={d.club}
                      className="w-8 h-8 object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        if (!e.target.dataset.triedProxy) {
                          e.target.dataset.triedProxy = "1";
                          e.target.src = buildProxy(d.clubImage);
                          return;
                        }
                        e.target.style.display = "none";
                        e.target.parentNode.innerHTML =
                          '<div class="w-8 h-8 bg-gray-600 rounded flex items-center justify-center text-xs">CLUB</div>';
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center text-xs">CLUB</div>
                  )}
                </div>
                <div className="text-sm text-gray-400 mb-1">Club</div>
                <div className="font-medium text-sm">{d.club}</div>
              </div>

              {/* Nation */}
              <div className="text-center bg-[#334155] rounded-lg p-3">
                <div className="w-8 h-6 mx-auto mb-2 flex items-center justify-center">
                  {d.nationImage ? (
                    <img
                      src={d.nationImage}
                      alt={d.nation}
                      className="w-8 h-6 object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        if (!e.target.dataset.triedProxy) {
                          e.target.dataset.triedProxy = "1";
                          e.target.src = buildProxy(d.nationImage);
                          return;
                        }
                        e.target.style.display = "none";
                        e.target.parentNode.innerHTML =
                          '<div class="w-8 h-6 bg-gray-600 rounded flex items-center justify-center text-xs">NAT</div>';
                      }}
                    />
                  ) : (
                    <div className="w-8 h-6 bg-gray-600 rounded flex items-center justify-center text-xs">NAT</div>
                  )}
                </div>
                <div className="text-sm text-gray-400 mb-1">Nation</div>
                <div className="font-medium text-sm">{d.nation}</div>
              </div>

              {/* League */}
              <div className="text-center bg-[#334155] rounded-lg p-3">
                <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                  {d.leagueImage ? (
                    <img
                      src={d.leagueImage}
                      alt={d.league}
                      className="w-8 h-8 object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        if (!e.target.dataset.triedProxy) {
                          e.target.dataset.triedProxy = "1";
                          e.target.src = buildProxy(d.leagueImage);
                          return;
                        }
                        e.target.style.display = "none";
                        e.target.parentNode.innerHTML =
                          '<div class="w-8 h-8 bg-gray-600 rounded flex items-center justify-center text-xs">LEG</div>';
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center text-xs">LEG</div>
                  )}
                </div>
                <div className="text-sm text-gray-400 mb-1">League</div>
                <div className="font-medium text-sm">{d.league}</div>
              </div>

              {/* Position */}
              <div className="text-center bg-[#334155] rounded-lg p-3">
                <Target className="w-6 h-6 mx-auto mb-2 text-red-400" />
                <div className="text-sm text-gray-400 mb-1">Position</div>
                <div className="font-medium">{d.position}</div>
              </div>
            </div>

            {/* Player Stats */}
            <div className="bg-[#334155] rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-3 text-lg">Player Stats</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {Object.entries(d.stats).map(([stat, value]) => (
                  <div key={stat} className="text-center">
                    <div className={`text-2xl font-bold ${getAttributeColor(value)}`}>{value}</div>
                    <div className="text-xs text-gray-400 capitalize">{stat}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill / Weak Foot / Age / Preferred Foot */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center bg-[#334155] rounded-lg p-3">
                <div className="text-lg font-semibold text-yellow-400">{"⭐".repeat(d.skillMoves)}</div>
                <div className="text-xs text-gray-400">Skill Moves</div>
              </div>
              <div className="text-center bg-[#334155] rounded-lg p-3">
                <div className="text-lg font-semibold text-yellow-400">{"⭐".repeat(d.weakFoot)}</div>
                <div className="text-xs text-gray-400">Weak Foot</div>
              </div>
              <div className="text-center bg-[#334155] rounded-lg p-3">
                <div className="text-sm font-semibold text-green-400">{d.age ? `${d.age} years` : "Unknown"}</div>
                <div className="text-xs text-gray-400">Age</div>
              </div>
              <div className="text-center bg-[#334155] rounded-lg p-3">
                <div className="text-sm font-semibold text-blue-400">{d.foot}</div>
                <div className="text-xs text-gray-400">Preferred Foot</div>
              </div>
            </div>
          </div>
        </div>

        {/* Watchlist CTA */}
        <div className="mt-1 mb-6 p-4 bg-[#0f1622] border border-[#243041] rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="text-sm text-gray-300">Track this player’s price on your Watchlist</div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="px-2 py-1 rounded-md bg-black/40 border border-[#2A2F36] text-white text-sm"
              title="Platform"
            >
              <option value="ps">PS</option>
              <option value="xbox">Xbox</option>
            </select>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="hidden md:block w-56 px-2 py-1 rounded-md bg-black/40 border border-[#2A2F36] text-white text-sm"
            />
            <button
              onClick={onAddClick}
              disabled={adding}
              className="px-3 py-2 rounded-md bg-lime-500/90 hover:bg-lime-500 text-black font-semibold"
            >
              {adding ? "Adding…" : "+ Add to Watchlist"}
            </button>
          </div>
        </div>

        {/* Detailed Attributes */}
        <div className="bg-[#334155] rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-3 text-lg">Detailed Attributes</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
            {Object.entries(d.attributes).map(
              ([attr, value]) =>
                value > 0 && (
                  <div key={attr} className="flex justify-between items-center bg-[#475569] rounded px-2 py-1">
                    <span className="text-gray-300 capitalize text-xs">
                      {attr.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className={`font-semibold ${getAttributeColor(value)}`}>{value}</span>
                  </div>
                )
            )}
          </div>
        </div>

        {/* Price History (orange chart) */}
        <div className="bg-[#334155] rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3 text-lg">Price History</h3>
          <PriceTrendChart
            playerId={cardId}
            platform={platform}
            initialTimeframe="today"
            height={300}
          />
        </div>

        {priceData?.auctions?.length > 0 && (
          <div className="bg-[#334155] rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-lg">Recent Sales</h3>
            <div className="space-y-2">
              {priceData.auctions.slice(0, 5).map((a, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm bg-[#475569] rounded px-3 py-2">
                  <span className="text-gray-400">
                    {a.soldDate ? new Date(a.soldDate).toLocaleString() : "—"}
                  </span>
                  <span className="font-medium text-yellow-400">
                    {a.soldPrice ? a.soldPrice.toLocaleString() : "N/A"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {priceData?.updatedAt && (
          <div className="text-center text-gray-400 text-xs mt-4">
            Price updated: {new Date(priceData.updatedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

// ================== Main ==================
export default function PlayerSearch() {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">
      <div className="container mx-auto">
        {!selectedPlayer ? (
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold text-white mb-8">Player Search</h1>
            <SearchBox onPlayerSelect={setSelectedPlayer} />
            <p className="text-gray-400 mt-4">
              Search by player name to view live market data and detailed stats
            </p>
          </div>
        ) : (
          <PlayerDetail player={selectedPlayer} onBack={() => setSelectedPlayer(null)} />
        )}
      </div>
    </div>
  );
}
