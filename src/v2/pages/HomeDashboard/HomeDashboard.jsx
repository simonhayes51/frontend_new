// src/v2/pages/HomeDashboard/HomeDashboard.jsx
import { useDashboardStats, useDashboardActivity } from "../../hooks/useDashboard";
import PulseSection from "./sections/PulseSection";
import PipelineHealthSection from "./sections/PipelineHealthSection";
import MoversSection from "./sections/MoversSection";
import ActivityFeedSection from "./sections/ActivityFeedSection";
import WatchlistWidgetSection from "./sections/WatchlistWidgetSection";

export default function HomeDashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useDashboardActivity();

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Home</h1>

      {statsLoading ? (
        <p className="text-sm text-[var(--v2-muted)]">Loading market pulse...</p>
      ) : (
        <>
          <PulseSection stats={stats} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MoversSection stats={stats} />
            <PipelineHealthSection stats={stats} />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WatchlistWidgetSection />
        {activityLoading ? (
          <p className="text-sm text-[var(--v2-muted)]">Loading activity...</p>
        ) : (
          <ActivityFeedSection activity={activity} />
        )}
      </div>
    </div>
  );
}
