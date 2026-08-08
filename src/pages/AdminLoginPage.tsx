import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../auth/AdminAuthContext";
import { PageIntro } from "../components/ui/PageIntro";

interface LoginLocationState {
  from?: string;
}

export function AdminLoginPage() {
  const { isAuthenticated, isConfigured, login } = useAdminAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const state = location.state as LoginLocationState | null;
  const destination =
    state?.from?.startsWith("/admin") && state.from !== "/admin/login"
      ? state.from
      : "/admin";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (login(code)) {
      void navigate(destination, { replace: true });
      return;
    }
    setError(
      isConfigured
        ? "That access code is not valid."
        : "Admin access is not configured for this deployment.",
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageIntro
        eyebrow="Convenience gate"
        title="Admin access"
        description="Enter the shared code to reveal data-entry tools. This client-side gate is not a security boundary."
      />
      <form className="card" onSubmit={handleSubmit}>
        <label className="text-sm font-bold" htmlFor="admin-code">
          Access code
        </label>
        <input
          id="admin-code"
          className="control mt-2"
          type="password"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setError("");
          }}
          autoComplete="current-password"
          disabled={!isConfigured}
        />
        {error && (
          <p className="mt-3 text-sm font-medium text-red-700" role="alert">
            {error}
          </p>
        )}
        <button
          className="button-primary mt-5 w-full"
          type="submit"
          disabled={!isConfigured || !code}
        >
          Continue
        </button>
      </form>
    </div>
  );
}
