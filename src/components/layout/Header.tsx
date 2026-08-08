import { FlagTriangleRight } from "lucide-react";
import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="border-b border-white/10 bg-fairway-900 text-white">
      <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-4 py-4 sm:px-6">
        <Link
          to="/"
          className="flex min-h-11 items-center gap-3 rounded-xl"
          aria-label="Fairway home"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-trophy-400 text-fairway-950">
            <FlagTriangleRight aria-hidden="true" size={22} strokeWidth={2.5} />
          </span>
          <span>
            <span className="block text-sm font-extrabold uppercase tracking-[0.18em]">
              Fairway
            </span>
            <span className="block text-xs text-fairway-100">Match Tracker</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
