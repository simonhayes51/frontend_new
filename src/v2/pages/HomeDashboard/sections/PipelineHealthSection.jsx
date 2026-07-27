// src/v2/pages/HomeDashboard/sections/PipelineHealthSection.jsx
import SectionCard from "../../../components/SectionCard";
import { formatRelativeTime } from "../../../lib/format";

const STATUS_COLOR = {
  ok: "text-[var(--v2-positive)]",
  failing: "text-[var(--v2-negative)]",
  unknown: "text-[var(--v2-muted)]",
};

export default function PipelineHealthSection({ stats }) {
  const pipeline = stats?.pipeline_status || [];
  return (
    <SectionCard title="Pipeline Health">
      <ul className="flex flex-col gap-2">
        {pipeline.map((p) => (
          <li key={p.name} className="flex items-center justify-between text-xs">
            <span className="text-[var(--v2-text)]">{p.name}</span>
            <span className={STATUS_COLOR[p.status] || STATUS_COLOR.unknown}>
              {p.status} · {formatRelativeTime(p.last_run_at)}
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
