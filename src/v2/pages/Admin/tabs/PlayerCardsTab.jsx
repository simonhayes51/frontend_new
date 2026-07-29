// src/v2/pages/Admin/tabs/PlayerCardsTab.jsx
//
// Manual per-player generation control for the PNG export pipeline
// (backend: app/services/player_card_generation.py), plus a bulk
// backfill trigger for missing/stale cards. The backfill runs as an
// in-process background job on the backend itself (not a shelled-out
// script) - this deploy environment has no terminal/shell access (see
// app/routers/admin.py's own docstring on exactly that constraint), so
// there's no other way to kick off scripts/generate_player_cards.py's
// logic from here. Only one backfill job runs at a time; this tab polls
// its status while running.
import { useEffect, useRef, useState } from "react";
import SectionCard from "../../../components/SectionCard";
import { api } from "../../../lib/api";

const STATUS_TONE = {
  ready: "text-[var(--v2-positive)]",
  generating: "text-[var(--v2-accent)]",
  error: "text-[var(--v2-negative)]",
};

function SingleCardControl() {
  const [cardId, setCardId] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  async function loadStatus(id) {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/admin/player-cards/${id}/status`);
      setStatus(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.userMessage || "Couldn't load status");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  async function generate(force) {
    if (!cardId) return;
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await api.post(`/api/admin/player-cards/${cardId}/generate`, { force });
      setStatus(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.userMessage || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function copyUrl() {
    if (!status?.imageUrl) return;
    navigator.clipboard?.writeText(status.imageUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <SectionCard title="Player Card PNGs" subtitle="Generate or regenerate the flattened export PNG for one card">
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Card ID"
          value={cardId}
          onChange={(e) => setCardId(e.target.value.trim())}
          onKeyDown={(e) => e.key === "Enter" && loadStatus(cardId)}
          className="px-2 py-1.5 rounded-md bg-black/30 border border-[var(--v2-border)] text-xs w-32"
        />
        <button
          type="button"
          onClick={() => loadStatus(cardId)}
          disabled={!cardId || loading}
          className="px-3 py-1.5 rounded-md border border-[var(--v2-border)] text-xs hover:bg-white/5 disabled:opacity-50"
        >
          Check status
        </button>
        <button
          type="button"
          onClick={() => generate(false)}
          disabled={!cardId || loading}
          className="px-3 py-1.5 rounded-md bg-[var(--v2-accent)] text-black font-medium text-xs disabled:opacity-50"
        >
          {loading ? "Working..." : "Generate"}
        </button>
        <button
          type="button"
          onClick={() => generate(true)}
          disabled={!cardId || loading}
          className="px-3 py-1.5 rounded-md border border-[var(--v2-border)] text-xs hover:bg-white/5 disabled:opacity-50"
        >
          Force regenerate
        </button>
      </div>

      {error && <p role="alert" className="text-xs text-[var(--v2-negative)] mb-3">{error}</p>}

      {status && (
        <div className="flex items-start gap-4">
          {status.imageUrl && (
            <img
              src={status.imageUrl}
              alt={`Generated card ${status.cardId ?? cardId}`}
              className="w-20 rounded border border-[var(--v2-border)] bg-black/20"
            />
          )}
          <div className="text-xs flex flex-col gap-1">
            <p>
              Status:{" "}
              <span className={`font-medium ${STATUS_TONE[status.status] || "text-[var(--v2-muted)]"}`}>
                {status.status || "never generated"}
              </span>
            </p>
            {status.generatedAt && (
              <p className="text-[var(--v2-muted)]">Generated: {new Date(status.generatedAt).toLocaleString()}</p>
            )}
            {status.width && status.height && (
              <p className="text-[var(--v2-muted)]">{status.width}×{status.height}px</p>
            )}
            {status.error && <p className="text-[var(--v2-negative)]">{status.error}</p>}
            {status.imageUrl && (
              <button
                type="button"
                onClick={copyUrl}
                className="self-start mt-1 px-2 py-1 rounded border border-[var(--v2-border)] hover:bg-white/5"
              >
                {copied ? "Copied!" : "Copy URL"}
              </button>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

const POLL_MS = 3000;

function BackfillControl() {
  const [mode, setMode] = useState("missing");
  const [limit, setLimit] = useState(200);
  const [concurrency, setConcurrency] = useState(1);
  const [force, setForce] = useState(false);
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);
  const pollRef = useRef(null);

  async function pollStatus() {
    try {
      const res = await api.get("/api/admin/player-cards/backfill/status");
      setJob(res.data);
      if (!res.data?.running && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch {
      // transient - next poll tick will retry
    }
  }

  useEffect(() => {
    pollStatus();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    setStarting(true);
    setError(null);
    try {
      const res = await api.post("/api/admin/player-cards/backfill", {
        mode,
        limit: Number(limit),
        concurrency: Number(concurrency),
        force,
      });
      setJob(res.data);
      if (res.data?.running && !pollRef.current) {
        pollRef.current = setInterval(pollStatus, POLL_MS);
      }
    } catch (err) {
      setError(err?.response?.data?.detail || err?.userMessage || "Couldn't start backfill");
    } finally {
      setStarting(false);
    }
  }

  const running = job?.running;

  return (
    <SectionCard
      title="Bulk Backfill"
      subtitle="Generates every missing (or stale) card's PNG in the background on the server - runs one Chromium instance, reused across the batch"
      className="mt-4"
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          disabled={running}
          className="px-2 py-1.5 rounded-md bg-black/30 border border-[var(--v2-border)] text-xs disabled:opacity-50"
        >
          <option value="missing">Missing (never generated / errored)</option>
          <option value="stale">Stale (data changed since last generation)</option>
        </select>
        <label className="flex items-center gap-1 text-xs text-[var(--v2-muted)]">
          Limit
          <input
            type="number"
            min={1}
            max={2000}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            disabled={running}
            className="w-20 px-2 py-1 rounded-md bg-black/30 border border-[var(--v2-border)] text-xs disabled:opacity-50"
          />
        </label>
        <label className="flex items-center gap-1 text-xs text-[var(--v2-muted)]">
          Concurrency
          <input
            type="number"
            min={1}
            max={4}
            value={concurrency}
            onChange={(e) => setConcurrency(e.target.value)}
            disabled={running}
            className="w-16 px-2 py-1 rounded-md bg-black/30 border border-[var(--v2-border)] text-xs disabled:opacity-50"
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-[var(--v2-muted)]">
          <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} disabled={running} />
          Force regenerate
        </label>
        <button
          type="button"
          onClick={start}
          disabled={running || starting}
          className="px-3 py-1.5 rounded-md bg-[var(--v2-accent)] text-black font-medium text-xs disabled:opacity-50"
        >
          {running ? "Running..." : starting ? "Starting..." : "Start backfill"}
        </button>
      </div>

      {error && <p role="alert" className="text-xs text-[var(--v2-negative)] mb-2">{error}</p>}

      {job && (job.total || job.running || job.finished_at) && (
        <div className="text-xs text-[var(--v2-muted)] flex flex-col gap-1">
          <p>
            {job.processed ?? 0} / {job.total ?? 0} processed
            {" · "}
            <span className="text-[var(--v2-positive)]">{job.succeeded ?? 0} ok</span>
            {" · "}
            <span className="text-[var(--v2-negative)]">{job.failed ?? 0} failed</span>
          </p>
          {job.running ? (
            <p>Running in the background - keep this tab open or check back later, it'll keep going either way.</p>
          ) : job.total ? (
            <p>Finished{job.finished_at ? ` at ${new Date(job.finished_at * 1000).toLocaleTimeString()}` : ""}.</p>
          ) : (
            <p>Nothing eligible - every card in this mode is already current.</p>
          )}
          {job.last_error && <p className="text-[var(--v2-negative)]">Job error: {job.last_error}</p>}
        </div>
      )}
    </SectionCard>
  );
}

export default function PlayerCardsTab() {
  return (
    <div>
      <SingleCardControl />
      <BackfillControl />
    </div>
  );
}
