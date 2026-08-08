import { Flag, Map, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../auth/AdminAuthContext";
import { PageIntro } from "../components/ui/PageIntro";

const adminLinks = [
  {
    to: "/admin/matches",
    title: "Match history",
    description: "Log, edit, and remove matches",
    icon: Flag,
  },
  {
    to: "/admin/players",
    title: "Players",
    description: "Manage the field",
    icon: Users,
  },
  {
    to: "/admin/courses",
    title: "Courses",
    description: "Manage venues",
    icon: Map,
  },
];

export function AdminPage() {
  const { logout } = useAdminAuth();

  return (
    <>
      <PageIntro
        eyebrow="Administration"
        title="Clubhouse"
        description="Data-entry routes are protected by the local convenience gate."
        action={
          <button className="button-secondary" type="button" onClick={logout}>
            Sign out
          </button>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        {adminLinks.map(({ to, title, description, icon: Icon }) => (
          <Link key={to} to={to} className="card group min-h-36 transition hover:-translate-y-0.5">
            <Icon className="text-trophy-700" aria-hidden="true" />
            <h2 className="mt-5 text-lg font-extrabold text-fairway-950 group-hover:text-fairway-700">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
