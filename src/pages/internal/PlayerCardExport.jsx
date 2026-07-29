// src/pages/internal/PlayerCardExport.jsx
//
// Not a page a user is meant to browse to - this is what the backend's
// headless Chromium (app/services/player_card_render.py) navigates to and
// screenshots. Deliberately outside PrivateRoute (Chromium has no session
// cookie) and instead gated by a short-lived signed `token` query param
// the backend mints right before launching the browser and verifies on
// every render-data request (see app/services/player_card_token.py) - so
// this route is reachable but not a usable public API without one.
//
// Renders nothing but the isolated, transparent PlayerCardArt(exportMode)
// element and sets document.documentElement.dataset.cardReady = "true"
// once fonts + every image in the card have settled, which is what the
// renderer's page.wait_for_function(...) call is waiting to see before it
// takes the screenshot.
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import api from "../../axios";
import PlayerCardArt from "../../components/PlayerCardArt";

const EXPORT_WIDTH = 432;
const EXPORT_HEIGHT = 576;

// How long to wait for every <img> in the card to finish loading (success
// or error) before giving up and marking ready anyway - a truly hung image
// request must not make generation wait forever, but a real failure
// should still be visible to the renderer (see the error-marker check
// below), not silently produce a blank/broken PNG.
const IMAGE_SETTLE_TIMEOUT_MS = 8000;

export default function PlayerCardExport() {
  const { cardId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [data, setData] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  // The whole app is wrapped in a couple of always-opaque containers
  // (App.jsx's #app-shell-bg div, body's --bg token) that have nothing to
  // do with this route - neutralise them here rather than touching their
  // shared styling, and put it back on unmount in case of client-side nav.
  useEffect(() => {
    const shell = document.getElementById("app-shell-bg");
    const prev = {
      html: document.documentElement.style.background,
      body: document.body.style.background,
      shell: shell?.style.background,
    };
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    if (shell) shell.style.background = "transparent";

    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);

    return () => {
      document.documentElement.style.background = prev.html;
      document.body.style.background = prev.body;
      if (shell) shell.style.background = prev.shell;
      document.head.removeChild(meta);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!cardId || !token) {
      setFetchError("missing card id or token");
      return;
    }
    api
      .get(`/api/internal/render/player-card/${cardId}`, {
        params: { token },
        __skipAuthRedirect: true,
        __noRetry: true,
      })
      .then((res) => {
        if (!cancelled) setData(res.data?.data || null);
      })
      .catch((err) => {
        if (!cancelled) setFetchError(err?.userMessage || "failed to load card data");
      });
    return () => {
      cancelled = true;
    };
  }, [cardId, token]);

  const altPositions = useMemo(() => data?.altPositions || [], [data]);

  // Readiness: fonts loaded + every <img> inside the export box settled
  // (loaded or errored, capped by a timeout) + two animation frames for
  // layout to fully settle, only then does the renderer's
  // page.wait_for_function(...) unblock.
  useEffect(() => {
    if (!data) return undefined;
    let cancelled = false;

    async function waitAndMarkReady() {
      await Promise.race([
        document.fonts?.ready ?? Promise.resolve(),
        new Promise((r) => setTimeout(r, IMAGE_SETTLE_TIMEOUT_MS)),
      ]);
      if (cancelled) return;

      const container = document.querySelector("[data-player-card-export]");
      const imgs = container ? Array.from(container.querySelectorAll("img")) : [];
      await Promise.race([
        Promise.all(
          imgs.map(
            (img) =>
              new Promise((resolve) => {
                if (img.complete) return resolve();
                img.addEventListener("load", resolve, { once: true });
                img.addEventListener("error", resolve, { once: true });
              })
          )
        ),
        new Promise((r) => setTimeout(r, IMAGE_SETTLE_TIMEOUT_MS)),
      ]);
      if (cancelled) return;

      // A missing/failed background image (when one was expected) means
      // this would render as a blank/broken card - fail loudly instead of
      // letting the renderer upload a broken PNG. The other layered
      // images (cutout/badges) degrade gracefully on their own (they're
      // just omitted), so only the background is treated as fatal.
      if (data.bgImage && container) {
        const bgImg = container.querySelector("img");
        if (bgImg && bgImg.complete && bgImg.naturalWidth === 0) {
          container.setAttribute("data-card-export-error", "bg-image-failed");
        }
      }

      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));
      if (cancelled) return;

      document.documentElement.dataset.cardReady = "true";
    }

    waitAndMarkReady();
    return () => {
      cancelled = true;
    };
  }, [data]);

  if (fetchError) {
    // No data-player-card-export marker at all - the renderer's own
    // wait_for(state="attached") call times out cleanly instead of
    // screenshotting an error page.
    return <div data-card-fetch-error={fetchError} />;
  }

  if (!data) return null;

  return (
    <PlayerCardArt
      exportMode
      exportWidth={EXPORT_WIDTH}
      exportHeight={EXPORT_HEIGHT}
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
      versionLabel={data.versionLabel}
      skillMoves={data.skillMoves}
      weakFoot={data.weakFoot}
      preferredFoot={data.preferredFoot}
      altPositions={altPositions}
    />
  );
}
