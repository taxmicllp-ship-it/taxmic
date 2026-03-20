import { Outlet } from "react-router";
import AppNavbar from "./AppNavbar";

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-950 flex flex-col">
      <AppNavbar />
      <main className="flex-1">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
