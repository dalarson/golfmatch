import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui/EmptyState";

export function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you requested is not part of this match tracker."
      action={
        <Link className="button-primary" to="/">
          Back to leaderboard
        </Link>
      }
    />
  );
}
