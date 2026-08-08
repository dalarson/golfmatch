import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";

export function AppShell() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-xl bg-white px-4 py-3 font-bold text-fairway-900 shadow-card transition focus:translate-y-0"
      >
        Skip to main content
      </a>
      <Header />
      <BottomNav />
      <main
        id="main-content"
        className="mx-auto w-full max-w-[1100px] px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 md:pb-10 md:pt-8"
      >
        <Outlet />
      </main>
    </div>
  );
}
