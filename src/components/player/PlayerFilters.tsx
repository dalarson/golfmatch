import { RotateCcw, SlidersHorizontal } from "lucide-react";
import type {
  PlayerHeadToHead,
  PlayerPartnership,
  PlayerStatsFilters,
} from "../../services/statistics";
import type { Course } from "../../services/schemas";

interface PlayerFiltersProps {
  filters: PlayerStatsFilters;
  courses: Course[];
  partnerships: PlayerPartnership[];
  opponents: PlayerHeadToHead[];
  activeLabels: string[];
  onChange: (key: keyof PlayerStatsFilters, value: string | null) => void;
  onReset: () => void;
}

export function PlayerFilters({
  filters,
  courses,
  partnerships,
  opponents,
  activeLabels,
  onChange,
  onReset,
}: PlayerFiltersProps) {
  return (
    <section className="card" aria-labelledby="player-filters-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Explore performance</p>
          <h2 id="player-filters-title" className="mt-1 text-xl font-extrabold">
            Filters
          </h2>
        </div>
        <SlidersHorizontal aria-hidden="true" className="text-fairway-700" />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-bold">
          Course
          <select
            className="control mt-2"
            value={filters.courseId ?? ""}
            onChange={(event) => onChange("courseId", event.target.value || null)}
          >
            <option value="">All courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold">
          Partner
          <select
            className="control mt-2"
            value={filters.partnerId ?? ""}
            onChange={(event) => onChange("partnerId", event.target.value || null)}
          >
            <option value="">All partners</option>
            {partnerships.map((partnership) => (
              <option key={partnership.partner_id} value={partnership.partner_id}>
                {partnership.partner_name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold">
          Opponent
          <select
            className="control mt-2"
            value={filters.opponentId ?? ""}
            onChange={(event) => onChange("opponentId", event.target.value || null)}
          >
            <option value="">All opponents</option>
            {opponents.map((opponent) => (
              <option key={opponent.opponent_id} value={opponent.opponent_id}>
                {opponent.opponent_name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold">
          Match length
          <select
            className="control mt-2"
            value={filters.holes ?? ""}
            onChange={(event) => onChange("holes", event.target.value || null)}
          >
            <option value="">All holes</option>
            <option value="9">9 holes</option>
            <option value="18">18 holes</option>
          </select>
        </label>
      </div>
      {activeLabels.length > 0 && (
        <div className="mt-5 border-t pt-4">
          <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
            {activeLabels.map((label) => (
              <span
                className="rounded-full bg-fairway-50 px-3 py-2 text-xs font-bold text-fairway-800"
                key={label}
              >
                {label}
              </span>
            ))}
            <button
              type="button"
              className="button-secondary ml-auto px-4"
              onClick={onReset}
            >
              <RotateCcw aria-hidden="true" size={16} />
              Clear all
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
