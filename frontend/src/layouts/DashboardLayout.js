import React, { useState, useContext, useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { AuthContext, API } from "../App";
import {
  LayoutDashboard,
  Beaker,
  Image,
  Radio,
  Users,
  BarChart3,
  FileText,
  Settings,
  ChevronDown,
  LogOut,
  Menu,
  X,
  GitBranch,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { ScrollArea } from "../components/ui/scroll-area";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_748ef24b-f1b0-4292-8fd8-756f578df920/artifacts/w50htqda_thecommons_Logo.png";

export default function DashboardLayout({ children }) {
  const { user, setUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (workspaceId && workspaces.length > 0) {
      const ws = workspaces.find((w) => w.workspace_id === workspaceId);
      setCurrentWorkspace(ws);
    }
  }, [workspaceId, workspaces]);

  const fetchWorkspaces = async () => {
    try {
      const response = await axios.get(`${API}/workspaces`, {
        withCredentials: true,
      });
      setWorkspaces(response.data);
      if (response.data.length > 0 && !workspaceId) {
        setCurrentWorkspace(response.data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isClientViewer = user?.roles?.some((r) => r.role === "client_viewer");
  const isAdmin = user?.roles?.some((r) => r.role === "admin");

  // Navigation items
  const globalNav = [
    { name: "Command Center", href: "/", icon: LayoutDashboard },
    { name: "Reports", href: "/reports", icon: FileText },
  ];

  const workspaceNav = currentWorkspace
    ? [
        { name: "Overview", href: `/workspace/${currentWorkspace.workspace_id}`, icon: LayoutDashboard },
        { name: "Experiments", href: `/workspace/${currentWorkspace.workspace_id}/experiments`, icon: Beaker },
        { name: "Creative OS", href: `/workspace/${currentWorkspace.workspace_id}/creative`, icon: Image },
        { name: "Distribution", href: `/workspace/${currentWorkspace.workspace_id}/distribution`, icon: Radio },
        { name: "Creators", href: `/workspace/${currentWorkspace.workspace_id}/creators`, icon: Users },
        { name: "Measurement", href: `/workspace/${currentWorkspace.workspace_id}/measurement`, icon: BarChart3 },
        { name: "Funnel Builder", href: `/workspace/${currentWorkspace.workspace_id}/funnel`, icon: GitBranch },
      ]
    : [];

  const adminNav = isAdmin
    ? [{ name: "Admin", href: "/admin", icon: Settings }]
    : [];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-testid="mobile-menu-toggle"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-black border-r border-zinc-800 
          transform transition-transform duration-200 ease-in-out
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-zinc-800">
            <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
              <img src={LOGO_URL} alt="thecommons" className="h-8 w-8" />
              <div>
                <h1 className="font-heading text-lg font-bold tracking-tight">thecommons.</h1>
                <p className="text-xs text-zinc-500">Growth OS</p>
              </div>
            </Link>
          </div>

          {/* Workspace Selector */}
          {workspaces.length > 0 && !isClientViewer && (
            <div className="p-4 border-b border-zinc-800">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-left font-normal"
                    data-testid="workspace-selector"
                  >
                    <span className="truncate">
                      {currentWorkspace?.name || "Select Workspace"}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800">
                  {workspaces.map((ws) => (
                    <DropdownMenuItem
                      key={ws.workspace_id}
                      onClick={() => {
                        setCurrentWorkspace(ws);
                        navigate(`/workspace/${ws.workspace_id}`);
                      }}
                      data-testid={`workspace-option-${ws.workspace_id}`}
                    >
                      {ws.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-4">
            {!isClientViewer && (
              <>
                {/* Global Navigation */}
                <div className="mb-6">
                  <p className="text-xs font-mono uppercase text-zinc-600 mb-3 tracking-wider">
                    Global
                  </p>
                  <nav className="space-y-1">
                    {globalNav.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`
                            flex items-center gap-3 px-3 py-2 rounded-sm text-sm
                            transition-colors duration-150
                            ${isActive
                              ? "bg-white text-black font-medium"
                              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                            }
                          `}
                          data-testid={`nav-${item.name.toLowerCase().replace(/\s/g, "-")}`}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* Workspace Navigation */}
                {currentWorkspace && (
                  <div className="mb-6">
                    <p className="text-xs font-mono uppercase text-zinc-600 mb-3 tracking-wider">
                      Workspace
                    </p>
                    <nav className="space-y-1">
                      {workspaceNav.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={`
                              flex items-center gap-3 px-3 py-2 rounded-sm text-sm
                              transition-colors duration-150
                              ${isActive
                                ? "bg-white text-black font-medium"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                              }
                            `}
                            data-testid={`nav-${item.name.toLowerCase().replace(/\s/g, "-")}`}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                )}

                {/* Admin Navigation */}
                {adminNav.length > 0 && (
                  <div>
                    <p className="text-xs font-mono uppercase text-zinc-600 mb-3 tracking-wider">
                      Settings
                    </p>
                    <nav className="space-y-1">
                      {adminNav.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={`
                              flex items-center gap-3 px-3 py-2 rounded-sm text-sm
                              transition-colors duration-150
                              ${isActive
                                ? "bg-white text-black font-medium"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                              }
                            `}
                            data-testid={`nav-${item.name.toLowerCase()}`}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                )}
              </>
            )}

            {/* Client Portal Link */}
            {isClientViewer && currentWorkspace && (
              <div>
                <p className="text-xs font-mono uppercase text-zinc-600 mb-3 tracking-wider">
                  Client Portal
                </p>
                <nav className="space-y-1">
                  <Link
                    to={`/client/${currentWorkspace.workspace_id}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-sm text-sm bg-white text-black font-medium"
                    data-testid="nav-client-portal"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </nav>
              </div>
            )}
          </ScrollArea>

          {/* User Menu */}
          <div className="p-4 border-t border-zinc-800">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-left font-normal"
                  data-testid="user-menu"
                >
                  <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-medium">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-sm truncate">{user?.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800">
                <DropdownMenuItem disabled>
                  <span className="text-xs text-zinc-500">
                    {user?.roles?.[0]?.role?.replace("_", " ").toUpperCase() || "USER"}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-400"
                  data-testid="logout-button"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen">
        <div className="p-6 md:p-8 lg:p-12">{children}</div>
      </main>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
