import { Trophy } from "lucide-react";
import { PageIntro } from "../components/ui/PageIntro";

export function HomePage() {
  return (
    <>
      <PageIntro
        eyebrow="Current rankings"
        title="The leaderboard starts here."
        description="Live ELO standings and career records will be powered by the database leaderboard view."
      />
      <section className="overflow-hidden rounded-card bg-fairway-900 p-6 text-white shadow-card sm:p-8">
        <div className="grid size-12 place-items-center rounded-2xl bg-trophy-400 text-fairway-950">
          <Trophy aria-hidden="true" />
        </div>
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.16em] text-trophy-400">
          Fairway standings
        </p>
        <h2 className="mt-2 max-w-lg text-2xl font-extrabold sm:text-3xl">
          A tournament-style home for every match.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-fairway-100">
          The visual foundation is ready for leaderboard data without moving ELO
          or career calculations into the browser.
        </p>
      </section>
    </>
  );
}
