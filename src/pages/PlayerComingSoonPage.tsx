import { ArrowLeft, BarChart3 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PageIntro } from "../components/ui/PageIntro";

export function PlayerComingSoonPage() {
  const { playerId } = useParams();

  return (
    <>
      <PageIntro
        eyebrow="Player profile"
        title="Performance profile coming next"
        description="Detailed ELO history and filterable player analytics are part of the next milestone."
      />
      <section className="card">
        <BarChart3 aria-hidden="true" className="text-fairway-700" />
        <p className="mt-4 text-sm leading-6 text-slate-600">
          This player is already linked from the public standings. Their complete
          profile will use authoritative database statistics without calculating
          career data in the browser.
        </p>
        <p className="sr-only">Player ID: {playerId}</p>
        <Link className="button-secondary mt-5" to="/">
          <ArrowLeft aria-hidden="true" size={18} />
          Back to rankings
        </Link>
      </section>
    </>
  );
}

