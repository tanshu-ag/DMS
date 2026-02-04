import { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Calendar,
  Plus,
  Settings,
  Users,
  LogOut,
  Menu,
  Bell,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/day", label: "Today", icon: CalendarDays },
  { path: "/month", label: "Month View", icon: CalendarRange },
  { path: "/year", label: "Year View", icon: Calendar },
  { path: "/new-appointment", label: "New Appointment", icon: Plus, highlight: true },
];

const adminItems = [
  { path: "/settings", label: "Settings", icon: Settings, roles: ["CRM"] },
  { path: "/users", label: "Users", icon: Users, roles: ["CRM"] },
];

const NavContent = ({ user, onNavigate, onLogout, currentPath }) => {
  const isActive = (path) => currentPath === path;

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="font-heading font-black text-lg tracking-tighter uppercase">
          BOHANIA<br />RENAULT
        </h1>
        <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mt-1">
          CR Department
        </p>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className={`w-full justify-start h-10 px-3 rounded-sm font-medium text-sm ${
                isActive(item.path)
                  ? "bg-black text-white hover:bg-gray-800"
                  : item.highlight
                  ? "bg-gray-100 hover:bg-gray-200"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => onNavigate(item.path)}
              data-testid={`nav-${item.path.slice(1) || "home"}`}
            >
              <item.icon className="w-4 h-4 mr-3" strokeWidth={1.5} />
              {item.label}
              {item.path === "/new-appointment" && (
                <ChevronRight className="w-4 h-4 ml-auto" strokeWidth={1.5} />
              )}
            </Button>
          ))}

          {/* Admin Section */}
          {user?.role === "CRM" && (
            <>
              <div className="pt-4 pb-2 px-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                  Admin
                </p>
              </div>
              {adminItems
                .filter((item) => item.roles.includes(user?.role))
                .map((item) => (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className={`w-full justify-start h-10 px-3 rounded-sm font-medium text-sm ${
                      isActive(item.path)
                        ? "bg-black text-white hover:bg-gray-800"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => onNavigate(item.path)}
                    data-testid={`nav-${item.path.slice(1)}`}
                  >
                    <item.icon className="w-4 h-4 mr-3" strokeWidth={1.5} />
                    {item.label}
                  </Button>
                ))}
            </>
          )}
        </nav>
      </ScrollArea>

      {/* User Info */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          {user?.picture ? (
            <img src={user.picture} alt="" className="w-8 h-8 rounded-sm object-cover" />
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded-sm flex items-center justify-center">
              <span className="text-xs font-bold">{user?.name?.[0] || "U"}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
              {user?.role}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start h-9 px-3 rounded-sm text-sm text-gray-500 hover:text-black hover:bg-gray-100"
          onClick={onLogout}
          data-testid="logout-button"
        >
          <LogOut className="w-4 h-4 mr-2" strokeWidth={1.5} />
          Sign out
        </Button>
      </div>
    </div>
  );
};

const Layout = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingTasks, setPendingTasks] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get(`${API}/tasks?status=pending`, { withCredentials: true });
        setPendingTasks(response.data.length);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      }
    };
    fetchTasks();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
    navigate("/login", { replace: true });
  }, [setUser, navigate]);

  const handleNavigate = useCallback((path) => {
    navigate(path);
    setSidebarOpen(false);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50/50 noise-bg" data-testid="app-layout">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-full w-[260px] bg-white border-r border-gray-200 z-40">
        <NavContent 
          user={user} 
          onNavigate={handleNavigate} 
          onLogout={handleLogout}
          currentPath={location.pathname}
        />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-40 px-4 flex items-center justify-between">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-sm" data-testid="mobile-menu">
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <NavContent 
              user={user} 
              onNavigate={handleNavigate} 
              onLogout={handleLogout}
              currentPath={location.pathname}
            />
          </SheetContent>
        </Sheet>

        <h1 className="font-heading font-bold text-sm tracking-tight uppercase">
          Bohania Renault
        </h1>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-sm"
            onClick={() => navigate("/dashboard")}
            data-testid="notifications-btn"
          >
            <Bell className="w-5 h-5" strokeWidth={1.5} />
          </Button>
          {pendingTasks > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] rounded-full flex items-center justify-center">
              {pendingTasks}
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-[260px] pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
