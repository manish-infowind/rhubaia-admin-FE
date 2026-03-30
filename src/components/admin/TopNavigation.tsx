import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Menu, Loader2, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { logout } from "../../redux/features/authSlice"
import type { RootState } from "@/redux/store/store";
import { getInitials } from "@/validations/validations";
import { AuthService } from "@/api/services/authService";

interface TopNavigationProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
};

const TopNavigation = ({ onToggleSidebar }: TopNavigationProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const authLoginState = useSelector((state: RootState) => state.auth.loginState) as {
    profilePic?: string;
    fullName?: string;
    email?: string;
    role?: string;
  } | undefined;

  const [loading, setLoading] = useState(false);

  // Logout Handler
  const logoutHandler = async () => {
    try {
      setLoading(true);
      await AuthService.logout();
    } catch {
      // Continue with logout even if API call fails
    } finally {
      dispatch(logout());
      setLoading(false);
      navigate('/', { replace: true });
    }
  };


  return (
    <motion.header
      className="flex h-16 items-center justify-between border-b bg-background px-6 shadow-sm"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 px-0 lg:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Avatar className="h-8 w-8">
                  {authLoginState?.profilePic ? (
                    <AvatarImage
                      src={`${authLoginState?.profilePic}?t=${Date.now()}`}
                      alt={authLoginState?.fullName || 'User'}
                    />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-brand-green to-brand-teal text-white">
                      {getInitials(
                        (authLoginState as { fullName?: string } | undefined)?.fullName || ''
                      )}
                    </AvatarFallback>
                  )}
                </Avatar>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {authLoginState?.fullName
                    ? authLoginState?.fullName
                    : 'Admin User'
                  }
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {authLoginState?.email || 'admin@rhubaia.com'}
                </p>
                {authLoginState?.role && (
                  <Badge
                    variant="secondary"
                    className="w-fit bg-gradient-to-r from-brand-green to-brand-teal text-white font-medium shadow-sm border-0 text-xs"
                  >
                    <Shield className="h-2 w-2 mr-1" />
                    {authLoginState.role.charAt(0).toUpperCase() + authLoginState?.role.slice(1)}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/admin/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logoutHandler}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
};

export default TopNavigation;
