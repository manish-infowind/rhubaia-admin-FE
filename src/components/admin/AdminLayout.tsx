import { useState } from "react";
import TopNavigation from "./TopNavigation";
import { SideNavigation } from "./SideNavigation";
import { AdminThemeProvider } from "./AdminThemeProvider";
import { AdminRouteGuard } from "@/components/auth/AdminRouteGuard";
import { motion } from "framer-motion";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AdminThemeProvider>
      <div className="flex h-screen bg-background">
        <SideNavigation
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <TopNavigation
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            isSidebarOpen={sidebarOpen}
          />

          <motion.main
            className="flex-1 overflow-auto p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <AdminRouteGuard>{children}</AdminRouteGuard>
          </motion.main>
        </div>
      </div>
    </AdminThemeProvider>
  );
}
