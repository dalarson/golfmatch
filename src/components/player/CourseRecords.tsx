import { Flag } from "lucide-react";
import type { PlayerCourseRecord } from "../../services/statistics";
import { RecordList } from "./RecordList";

export function CourseRecords({ records }: { records: PlayerCourseRecord[] }) {
  return (
    <section className="card" aria-labelledby="course-records-title">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">By venue</p>
          <h2 id="course-records-title" className="mt-1 text-xl font-extrabold">
            Course records
          </h2>
        </div>
        <Flag aria-hidden="true" className="text-fairway-700" />
      </div>
      <RecordList
        emptyMessage="Course records will appear after this player completes a match."
        items={records.map((record) => ({
          id: record.course_id,
          name: record.course_name,
          matches: record.matches,
          wins: record.wins,
          losses: record.losses,
          pushes: record.pushes,
          winPercentage: record.win_percentage,
          detail: (
            <span className="text-xs font-bold text-slate-500">
              {record.elo_change > 0 ? "+" : ""}
              {record.elo_change} ELO
            </span>
          ),
        }))}
      />
    </section>
  );
}
