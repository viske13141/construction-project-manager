import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  CalendarRange,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Compass,
  FileBarChart2,
  FileText,
  FolderKanban,
  GitCompareArrows,
  HardHat,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Milestone,
  PackageCheck,
  Search,
  Settings,
  ShieldCheck,
  Truck,
  UserCircle,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { DateRangePreset, usePMStore } from "../../store/pmStore";
import { cn, formatINR } from "../../lib/utils";
import { GlobalSearchModal } from "./GlobalSearchModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { toast } from "sonner";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export function PMShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    profile,
    projects,
    selectedProjectId,
    recentProjectIds,
    dateRange,
    notifications,
    approvals,
    dailyReports,
    setSelectedProjectId,
    setDateRange,
  } = usePMStore();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    portfolio: true,
    field: true,
    governance: true,
    workspace: true,
  });

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );
  const pendingApprovalsCount = useMemo(
    () => approvals.filter((a) => a.status === "Pending").length,
    [approvals]
  );
  const pendingDprCount = useMemo(
    () => dailyReports.filter((d) => d.reviewStatus === "Pending Review").length,
    [dailyReports]
  );

  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        id: "portfolio",
        label: "Portfolio & Planning",
        items: [
          { label: "Overview", to: "/", icon: LayoutDashboard },
          { label: "My Projects", to: "/projects", icon: FolderKanban },
          { label: "Project Comparison", to: "/comparison", icon: GitCompareArrows },
          { label: "Project Timeline", to: "/timeline", icon: CalendarRange },
          { label: "Milestones & Tasks", to: "/milestones", icon: Milestone },
        ],
      },
      {
        id: "field",
        label: "Field & Operations",
        items: [
          { label: "Project Workforce", to: "/workforce", icon: Users },
          { label: "Site Performance", to: "/sites", icon: Building2 },
          { label: "Materials & Procurement", to: "/materials", icon: PackageCheck },
          { label: "Equipment & Assets", to: "/equipment", icon: Truck },
          {
            label: "Daily Progress Reports",
            to: "/daily-reports",
            icon: ClipboardList,
            badge: pendingDprCount || undefined,
          },
        ],
      },
      {
        id: "governance",
        label: "Cost, Risk & Approvals",
        items: [
          { label: "Budget & Cost Control", to: "/budget", icon: Wallet },
          { label: "Project Issues & Risks", to: "/issues", icon: AlertTriangle },
          {
            label: "Approvals",
            to: "/approvals",
            icon: CheckSquare,
            badge: pendingApprovalsCount || undefined,
          },
          { label: "Project Documents", to: "/documents", icon: FileText },
          { label: "Reports & Analytics", to: "/reports", icon: FileBarChart2 },
        ],
      },
      {
        id: "workspace",
        label: "Workspace & Account",
        items: [
          {
            label: "Notifications",
            to: "/notifications",
            icon: Bell,
            badge: unreadCount || undefined,
          },
          { label: "My Profile", to: "/profile", icon: UserCircle },
          { label: "Settings", to: "/settings", icon: Settings },
        ],
      },
    ],
    [pendingApprovalsCount, pendingDprCount, unreadCount]
  );

  const recentProjects = useMemo(
    () =>
      recentProjectIds
        .map((id) => projects.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p)),
    [recentProjectIds, projects]
  );

  const currentPageTitle = useMemo(() => {
    if (location.pathname.startsWith("/projects/")) return "Project Details Workspace";
    for (const g of navGroups) {
      const found = g.items.find((i) => i.to === location.pathname);
      if (found) return found.label;
    }
    return "Project Manager Overview";
  }, [location.pathname, navGroups]);

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderSidebarNav = (mobile = false) => (
    <div className="flex h-full flex-col bg-[#101F35] text-slate-200 select-none">
      {/* Brand Lockup */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <button
          type="button"
          onClick={() => {
            navigate("/");
            if (mobile) setMobileDrawerOpen(false);
          }}
          className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2563EB] text-white">
            <HardHat className="h-4.5 w-4.5" />
          </div>
          {(!collapsed || mobile) && (
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight text-white whitespace-nowrap">
                BuildFlow
              </p>
              <p className="text-[11px] text-slate-400 whitespace-nowrap">
                Project Manager
              </p>
            </div>
          )}
        </button>
        {!mobile && (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
        {mobile && (
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-300 hover:bg-white/10 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Assigned Scope Summary */}
      {(!collapsed || mobile) && (
        <div className="border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="h-9 w-9 rounded-lg object-cover border border-white/15 shrink-0"
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">
                {profile.name}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {profile.assignedProjectIds.length} Assigned Projects
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <nav
        aria-label="Project Manager navigation"
        className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4"
      >
        {navGroups.map((group) => {
          const isOpen = expandedGroups[group.id] ?? true;
          return (
            <div key={group.id}>
              {(!collapsed || mobile) && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="mb-1.5 flex w-full items-center justify-between px-2.5 py-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase hover:text-slate-200 cursor-pointer"
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-150",
                      !isOpen && "-rotate-90"
                    )}
                  />
                </button>
              )}
              {(isOpen || (collapsed && !mobile)) && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === "/"}
                        onClick={() => mobile && setMobileDrawerOpen(false)}
                        title={collapsed && !mobile ? item.label : undefined}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors duration-150",
                            isActive
                              ? "bg-[#2563EB] text-white"
                              : "text-slate-300 hover:bg-white/8 hover:text-white",
                            collapsed && !mobile && "justify-center px-2"
                          )
                        }
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="h-4 w-4 shrink-0" />
                          {(!collapsed || mobile) && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </div>
                        {(!collapsed || mobile) && item.badge !== undefined && (
                          <span className="rounded bg-white/15 px-1.5 py-0.5 text-[11px] font-mono tabular-nums text-white">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Sign-out */}
      <div className="border-t border-white/10 p-2.5">
        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-slate-300 hover:bg-white/8 hover:text-white transition-colors cursor-pointer",
            collapsed && !mobile && "justify-center"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {(!collapsed || mobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172B4D] flex">
      {/* Desktop Fixed Sidebar */}
      <aside
        className={cn(
          "hidden lg:block shrink-0 border-r border-[#101F35] transition-all duration-200 sticky top-0 h-screen",
          collapsed ? "w-[72px]" : "w-[264px]"
        )}
      >
        {renderSidebarNav(false)}
      </aside>

      {/* Mobile Slide-Out Navigation Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#101F35]/50"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside className="relative z-10 w-[280px] max-w-[85vw] h-full shadow-2xl">
            {renderSidebarNav(true)}
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-14 lg:h-16 items-center justify-between gap-3 border-b border-[#E2E8F0] bg-white px-4 lg:px-6">
          {/* Left: Mobile Trigger + Page Context + Project Selector */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open navigation menu"
              className="flex lg:hidden h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#172B4D] hover:bg-slate-50 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden xl:flex items-center gap-2 text-xs text-[#64748B] whitespace-nowrap">
              <Compass className="h-3.5 w-3.5 text-[#2563EB]" />
              <span className="font-medium text-[#172B4D]">{currentPageTitle}</span>
            </div>

            {/* Project Scope Selector */}
            <div className="flex items-center gap-1.5 min-w-0">
              <label htmlFor="global-project-select" className="sr-only">
                Select Assigned Project
              </label>
              <select
                id="global-project-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="h-9 max-w-[190px] sm:max-w-[260px] rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] px-2.5 text-xs font-medium text-[#172B4D] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 truncate cursor-pointer"
              >
                <option value="ALL">All Assigned Projects ({projects.length})</option>
                <optgroup label="Assigned Portfolio">
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} · {p.name}
                    </option>
                  ))}
                </optgroup>
                {recentProjects.length > 0 && (
                  <optgroup label="Recently Viewed">
                    {recentProjects.map((rp) => (
                      <option key={`recent-${rp.id}`} value={rp.id}>
                        Recent: {rp.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Date Range Selector */}
            <div className="hidden md:flex items-center">
              <label htmlFor="global-date-range" className="sr-only">
                Reporting Period
              </label>
              <select
                id="global-date-range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRangePreset)}
                className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#64748B] focus:border-[#2563EB] focus:outline-none cursor-pointer"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">Full Project Cycle</option>
              </select>
            </div>
          </div>

          {/* Right: Search + Notifications + Help + Profile */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-9 items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] px-3 text-xs text-[#64748B] hover:border-slate-300 hover:text-[#172B4D] transition-colors cursor-pointer"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden md:inline-block rounded border border-[#E2E8F0] bg-white px-1.5 py-0.5 text-[10px] font-mono text-[#64748B]">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => navigate("/notifications")}
              aria-label="Open notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#172B4D] hover:bg-slate-50 cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#DC2626] px-1 text-[10px] font-semibold text-white tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              aria-label="Project Manager scope and authority guide"
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#172B4D] hover:bg-slate-50 cursor-pointer"
            >
              <HelpCircle className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="flex h-9 items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white pl-1.5 pr-2.5 hover:bg-slate-50 cursor-pointer"
            >
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                referrerPolicy="no-referrer"
                className="h-6 w-6 rounded-md object-cover"
              />
              <span className="hidden md:inline text-xs font-medium text-[#172B4D] whitespace-nowrap">
                {profile.name.split(" ")[0]}
              </span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (<= 15% viewport height, >= 44px touch targets) */}
      <nav
        aria-label="Mobile quick navigation"
        className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-[#E2E8F0] bg-white px-2 lg:hidden"
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              "flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-2 text-[11px] font-medium",
              isActive ? "text-[#2563EB]" : "text-[#64748B]"
            )
          }
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Overview</span>
        </NavLink>
        <NavLink
          to="/projects"
          className={({ isActive }) =>
            cn(
              "flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-2 text-[11px] font-medium",
              isActive ? "text-[#2563EB]" : "text-[#64748B]"
            )
          }
        >
          <FolderKanban className="h-4 w-4" />
          <span>Projects</span>
        </NavLink>
        <NavLink
          to="/approvals"
          className={({ isActive }) =>
            cn(
              "relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-2 text-[11px] font-medium",
              isActive ? "text-[#2563EB]" : "text-[#64748B]"
            )
          }
        >
          <CheckSquare className="h-4 w-4" />
          <span>Approvals</span>
          {pendingApprovalsCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#F59E0B] px-1 text-[10px] font-bold text-[#101F35]">
              {pendingApprovalsCount}
            </span>
          )}
        </NavLink>
        <NavLink
          to="/daily-reports"
          className={({ isActive }) =>
            cn(
              "flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-2 text-[11px] font-medium",
              isActive ? "text-[#2563EB]" : "text-[#64748B]"
            )
          }
        >
          <ClipboardList className="h-4 w-4" />
          <span>DPRs</span>
        </NavLink>
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-2 text-[11px] font-medium text-[#64748B]"
        >
          <BarChart3 className="h-4 w-4" />
          <span>Modules</span>
        </button>
      </nav>

      {/* Modals */}
      <GlobalSearchModal open={searchOpen} onOpenChange={setSearchOpen} />

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#2563EB]" />
              Project Manager Authority & Data Scope
            </DialogTitle>
            <DialogDescription>
              Access policies configured by Company Admin for {profile.organizationName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs text-[#172B4D]">
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] p-3">
              <p className="font-semibold">Assigned Scope Isolation</p>
              <p className="mt-1 text-[#64748B]">
                You see only the {profile.assignedProjectIds.length} projects explicitly assigned to you. Unassigned company projects, employee salary sheets, and bank disbursements remain restricted.
              </p>
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] p-3">
              <p className="font-semibold">Financial Authority Threshold</p>
              <p className="mt-1 text-[#64748B]">
                Project-level approvals up to{" "}
                <span className="font-mono font-semibold text-[#172B4D]">
                  {formatINR(profile.approvalAuthorityLimitInr)}
                </span>{" "}
                are within your sign-off limit. Higher requests automatically route to Company Admin / Finance, and maker-checker blocks self-approval.
              </p>
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] p-3">
              <p className="font-semibold">Sample Data Notice</p>
              <p className="mt-1 text-[#64748B]">
                All metrics, DPRs, and schedules displayed in this workspace are illustrative Indian construction sample data structured for Supabase PostgreSQL + RLS integration.
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setHelpOpen(false)}>Understood</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign Out of BuildFlow</DialogTitle>
            <DialogDescription>
              You are currently signed in as {profile.name} ({profile.designation}) in sample demonstration mode.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
              Stay Signed In
            </Button>
            <Button
              variant="navy"
              onClick={() => {
                setLogoutOpen(false);
                toast.info("Demo session remains active — use Settings to reset sample data.");
              }}
            >
              Confirm Sign Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
