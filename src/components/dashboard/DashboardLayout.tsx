import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";

// The whole authenticated shell. <Outlet /> renders whichever child route
// matched (Overview, Chats, Tasks, etc.) — this is React Router's
// equivalent of Next.js's {children} in a layout.tsx.
//
// Sidebar is fixed/off-canvas on mobile (see Sidebar.tsx) and sticky
// in-flow on desktop — this component owns whether it's open so both
// Sidebar (for the drawer + scrim) and Topbar (for the hamburger button
// that opens it) can share the same state.
export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-dash-bg">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
          <div className="flex-1 p-6 md:p-10">
            <Outlet />
          </div>
          <DashboardFooter />
        </div>
      </div>
    </ProtectedRoute>
  );
}
