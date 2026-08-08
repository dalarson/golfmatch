import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";

export function AppShell() {
  return (
    <div className="min-h-dvh">
      <Header />
      <BottomNav />
      <main className="mx-auto w-full max-w-[1100px] px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 md:pb-10 md:pt-8">
        <Outlet />
      </main>
    </div>
  );
}
