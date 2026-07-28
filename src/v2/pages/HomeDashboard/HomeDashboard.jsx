// src/v2/pages/HomeDashboard/HomeDashboard.jsx
//
// Two-column layout matching the reference design: main content column
// (signals hero row, movers, pipeline health, watchlist, activity) plus
// a persistent right rail (Live Alerts + Market State) that stays real -
// no invented panels (a Risk/Invalidation-style panel would need a
// backend signal that doesn't exist, so it's left out rather than
// stubbed).
import { useDashboardStats, useDashboardActivity } from "../../hooks/useDashboard";
import MarketStateGauge from "../../components/MarketStateGauge";
import LiveAlertsSection from "../../components/LiveAlertsSection";
import PulseSection from "./sections/PulseSection";
import PipelineHealthSection from "./sections/PipelineHealthSection";
import MoversSection from "./sections/MoversSection";
import ActivityFeedSection from "./sections/ActivityFeedSection";
import WatchlistWidgetSection from "./sections/WatchlistWidgetSection";
import TodaysSignalsSection from "./sections/TodaysSignalsSection";

export default function HomeDashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useDashboardActivity();

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Home</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="flex flex-col gap-6 min-w-0">
          <TodaysSignalsSection />

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

        <div className="flex flex-col gap-6">
          <LiveAlertsSection activity={activity} />
          <MarketStateGauge />
        </div>
      </div>
    </div>
  );
}
