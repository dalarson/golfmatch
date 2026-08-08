import { Swords } from "lucide-react";
import type { PlayerHeadToHead } from "../../services/statistics";
import { RecordList } from "./RecordList";

export function HeadToHeadStats({
  opponents,
}: {
  opponents: PlayerHeadToHead[];
}) {
  return (
    <section className="card" aria-labelledby="head-to-head-title">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Player perspective</p>
          <h2 id="head-to-head-title" className="mt-1 text-xl font-extrabold">
            Head to head
          </h2>
        </div>
        <Swords aria-hidden="true" className="text-fairway-700" />
      </div>
      <RecordList
        emptyMessage="Head-to-head records will appear after this player faces an opponent."
        items={opponents.map((opponent) => ({
          id: opponent.opponent_id,
          name: opponent.opponent_name,
          matches: opponent.matches,
          wins: opponent.wins,
          losses: opponent.losses,
          pushes: opponent.pushes,
          winPercentage: opponent.win_percentage,
        }))}
      />
    </section>
  );
}
