import { Outlet } from "react-router-dom";
import { MainNavigation } from "./MainNavigation";
import { Header } from "./Header";

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <MainNavigation />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};