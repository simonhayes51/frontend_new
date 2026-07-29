// src/pages/internal/PlayerCardExport.jsx
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import api from "../../axios";
import PlayerCardExportArt from "../../components/PlayerCardExportArt";

const EXPORT_WIDTH = 252;
const EXPORT_HEIGHT = 355;
const IMAGE_SETTLE_TIMEOUT_MS = 8000;

export default function PlayerCardExport() {
  const { cardId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [data, setData] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const shell = document.getElementById("app-shell-bg");
    const previous = {
      htmlBackground: document.documentElement.style.background,
      htmlOverflow: document.documentElement.style.overflow,
      bodyBackground: document.body.style.background,
      bodyMargin: document.body.style.margin,
      bodyOverflow: document.body.style.overflow,
      shellBackground: shell?.style.background,
    };

    document.documentElement.style.background = "transparent";
    document.documentElement.style.overflow = "hidden";
    document.body.style.background = "transparent";
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    if (shell) shell.style.background = "transparent";

    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after { animation:none!important; transition:none!important; box-sizing:border-box!important; }
      html, body, #root, #app-shell-bg {
        width:${EXPORT_WIDTH}px!important; height:${EXPORT_HEIGHT}px!important;
        min-width:0!important; min-height:0!important; margin:0!important; padding:0!important;
        overflow:hidden!important; background:transparent!important;
      }
    `;
    document.head.appendChild(style);

    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);

    return () => {
      document.documentElement.style.background = previous.htmlBackground;
      document.documentElement.style.overflow = previous.htmlOverflow;
      document.body.style.background = previous.bodyBackground;
      document.body.style.margin = previous.bodyMargin;
      document.body.style.overflow = previous.bodyOverflow;
      if (shell) shell.style.background = previous.shellBackground;
      style.remove();
      meta.remove();
      delete document.documentElement.dataset.cardReady;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!cardId || !token) {
      setFetchError("missing card id or token");
      return undefined;
    }

    api.get(`/api/internal/render/player-card/${cardId}`, {
      params: { token },
      __skipAuthRedirect: true,
      __noRetry: true,
    }).then((response) => {
      if (!cancelled) setData(response.data?.data || null);
    }).catch((error) => {
      if (!cancelled) setFetchError(error?.userMessage || "failed to load card data");
    });

    return () => { cancelled = true; };
  }, [cardId, token]);

  useEffect(() => {
    if (!data) return undefined;
    let cancelled = false;

    async function markReady() {
      await Promise.race([
        document.fonts?.ready ?? Promise.resolve(),
        new Promise((resolve) => setTimeout(resolve, IMAGE_SETTLE_TIMEOUT_MS)),
      ]);
      if (cancelled) return;

      const container = document.querySelector("[data-player-card-export]");
      const images = container ? Array.from(container.querySelectorAll("img")) : [];
      await Promise.race([
        Promise.all(images.map(async (image) => {
          if (!image.complete) {
            await new Promise((resolve) => {
              image.addEventListener("load", resolve, { once: true });
              image.addEventListener("error", resolve, { once: true });
            });
          }
          if (image.naturalWidth > 0 && typeof image.decode === "function") {
            try { await image.decode(); } catch { /* already decoded */ }
          }
        })),
        new Promise((resolve) => setTimeout(resolve, IMAGE_SETTLE_TIMEOUT_MS)),
      ]);
      if (cancelled) return;

      const background = container?.querySelector("[data-card-background]");
      if (data.bgImage && (!background || background.naturalWidth === 0)) {
        container?.setAttribute("data-card-export-error", "bg-image-failed");
      }

      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (!cancelled) document.documentElement.dataset.cardReady = "true";
    }

    markReady();
    return () => { cancelled = true; };
  }, [data]);

  if (fetchError) return <div data-card-fetch-error={fetchError} />;
  if (!data) return null;

  return <PlayerCardExportArt
    width={EXPORT_WIDTH}
    height={EXPORT_HEIGHT}
    bgImage={data.bgImage}
    cutoutImage={data.cutoutImage}
    cutoutType={data.cutoutType || "special"}
    fallbackImage={data.fallbackImage}
    rating={data.rating}
    position={data.position}
    name={data.displayName || data.name}
    altText={data.name}
    stats={data.stats}
    nationImage={data.nationImage}
    leagueImage={data.leagueImage}
    clubImage={data.clubImage}
  />;
}
