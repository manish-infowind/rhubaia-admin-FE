import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  ChevronRight,
  Users,
  UserCog,
  Key,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogoIcon } from "@/components/ui/logo-icon";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import {
  canAccessAdminManagement,
  canManageAdminUsers,
  canManageRoles,
  canManagePermissions,
  canPerformAction,
} from "@/lib/permissions";
import React, { useState, useEffect } from "react";


type NavItem = {
  name: string;
  href: string;
  icon: any;
  canAccess: boolean;
};

interface SideNavigationProps {
  isOpen: boolean;
  onClose: () => void;
};


export function SideNavigation({ isOpen, onClose }: SideNavigationProps) {
  const location = useLocation();
  const loginState = useSelector((state: RootState) => state.auth.loginState);
  const [adminManagementOpen, setAdminManagementOpen] = useState(false);

  const navigation: NavItem[] = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      canAccess: canPerformAction(loginState as any, "dashboard", "read"),
    },
    {
      name: "System Users",
      href: "/admin/users",
      icon: UserCheck,
      canAccess: canPerformAction(loginState as any, "user_management", "read"),
    },
    {
      name: "AI Usage",
      href: "/admin/ai-usage",
      icon: Sparkles,
      canAccess: canPerformAction(loginState as any, "ai_usage", "read"),
    },
  ].filter((item) => item.canAccess);

  // Check if user has permission to access admin management
  const hasAdminAccess = canAccessAdminManagement(loginState as any);
  
  // Admin Management sub-items with permission checks
  const adminManagementItems = [
    {
      name: "Admin Users",
      href: "/admin/management/users",
      icon: Users,
      canAccess: canManageAdminUsers(loginState as any, 'read'),
    },
    {
      name: "Roles",
      href: "/admin/management/roles",
      icon: UserCog,
      canAccess: canManageRoles(loginState as any, 'read'),
    },
    {
      name: "Permissions",
      href: "/admin/management/permissions",
      icon: Key,
      canAccess: canManagePermissions(loginState as any, 'read'),
    },
  ].filter(item => item.canAccess);

  // Check if any admin management route is active
  const isAdminManagementActive = location.pathname.startsWith('/admin/management');

  // Auto-expand admin management if on one of its routes
  React.useEffect(() => {
    if (isAdminManagementActive) {
      setAdminManagementOpen(true);
    }
  }, [isAdminManagementActive]);

  const sidebarContent = (
    <motion.div
      className="flex h-full flex-col bg-sidebar border-r"
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      exit={{ x: -280 }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
    >
      {/* Header with Logo */}
      <div className="flex h-32 items-center justify-center px-6 py-4">
        <div className="h-24 w-24 rounded-full overflow-hidden bg-brand-green p-3 shadow-lg flex items-center justify-center">
          <LogoIcon size="lg" className="h-16 w-16" />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-6 space-y-1 py-2">
          <div className="space-y-0.5">
            {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <motion.div
                    key={item.name}
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Link
                      to={item.href}
                      onClick={() => window.innerWidth < 1024 && onClose()}
                    >
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3 h-10 text-base",
                          isActive &&
                          "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                        {isActive && (
                          <motion.div
                            className="ml-auto"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 25,
                            }}
                          >
                            <ChevronRight className="h-5 w-5" />
                          </motion.div>
                        )}
                      </Button>
                    </Link>
                  </motion.div>
                );
              })}

            {/* Admin Management Section with Sub-items */}
            {hasAdminAccess && (
              <div className="mt-2">
                <Button
                  variant={isAdminManagementActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-between gap-3 h-10 text-base",
                    isAdminManagementActive &&
                    "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                  )}
                  onClick={() => setAdminManagementOpen(!adminManagementOpen)}
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" />
                    <span>Admin Management</span>
                  </div>
                  <motion.div
                    animate={{ rotate: adminManagementOpen ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </motion.div>
                </Button>

                <AnimatePresence>
                  {adminManagementOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-sidebar-accent/30 pl-4">
                        {adminManagementItems.map((subItem) => {
                          const isSubActive = location.pathname === subItem.href;
                          return (
                            <motion.div
                              key={subItem.name}
                              whileHover={{ x: 4 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            >
                              <Link
                                to={subItem.href}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                              >
                                <Button
                                  variant={isSubActive ? "secondary" : "ghost"}
                                  className={cn(
                                    "w-full justify-start gap-3 h-9 text-sm",
                                    isSubActive &&
                                    "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                                  )}
                                >
                                  <subItem.icon className="h-4 w-4" />
                                  {subItem.name}
                                </Button>
                              </Link>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex items-center gap-2 px-2 py-1">
          <LogoIcon size="sm" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Rhubaia</span>
            <span className="text-xs text-muted-foreground">Admin Panel</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="lg:hidden">
            <motion.div
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-64">
              {sidebarContent}
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
