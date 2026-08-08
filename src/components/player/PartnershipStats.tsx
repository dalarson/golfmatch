import { Users } from "lucide-react";
import type { PlayerPartnership } from "../../services/statistics";
import { RecordList } from "./RecordList";

export function PartnershipStats({
  partnerships,
}: {
  partnerships: PlayerPartnership[];
}) {
  return (
    <section className="card" aria-labelledby="partnership-title">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">2v2 teammates</p>
          <h2 id="partnership-title" className="mt-1 text-xl font-extrabold">
            Partnerships
          </h2>
        </div>
        <Users aria-hidden="true" className="text-fairway-700" />
      </div>
      <RecordList
        emptyMessage="Play a 2v2 match to start building partnership statistics."
        items={partnerships.map((partnership) => ({
          id: partnership.partner_id,
          name: partnership.partner_name,
          matches: partnership.matches,
          wins: partnership.wins,
          losses: partnership.losses,
          pushes: partnership.pushes,
          winPercentage: partnership.win_percentage,
        }))}
      />
    </section>
  );
}
