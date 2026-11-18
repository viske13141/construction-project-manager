import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  FolderKanban,
  HardHat,
  Search,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePMStore } from "../../store/pmStore";
import { PHASE_PROGRESS_SERIES } from "../../data/mockProjectManagerData";
import {
  cn,
  exportToCSV,
  formatDate,
  formatINR,
  formatRelativeTime,
} from "../../lib/utils";
import { ProjectHealthStatus, ProjectStatus } from "../../types/projectManager";
import { StatusIndicator } from "../../components/shared/StatusIndicator";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

export function OverviewPage() {
  const navigate = useNavigate();
  const {
    profile,
    projects,
    sites,
    activityLogs,
    approvals,
    dailyReports,
    selectedProjectId,
    dateRange,
    setSelectedProjectId,
  } = usePMStore();

  const [portfolioFilter, setPortfolioFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "progress" | "budget" | "schedule">("name");

  const scopedProjects = useMemo(
    () =>
      selectedProjectId === "ALL"
        ? projects
        : projects.filter((p) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const scopedSites = useMemo(
    () =>
      selectedProjectId === "ALL"
        ? sites
        : sites.filter((s) => s.projectId === selectedProjectId),
    [sites, selectedProjectId]
  );

  // Portfolio KPI computations (strictly derived from scoped assigned records)
  const kpis = useMemo(() => {
    const totalAssigned = scopedProjects.length;
    const activeCount = scopedProjects.filter((p) =>
      [ProjectStatus.ACTIVE, ProjectStatus.ON_TRACK, ProjectStatus.AT_RISK, ProjectStatus.DELAYED].includes(
        p.status
      )
    ).length;
    const onScheduleCount = scopedProjects.filter((p) => p.scheduleVarianceDays >= 0).length;
    const delayedCount = scopedProjects.filter((p) => p.scheduleVarianceDays < 0).length;
    const avgCompletion = totalAssigned
      ? Math.round(
          scopedProjects.reduce((acc, p) => acc + p.actualProgress, 0) / totalAssigned
        )
      : 0;
    const totalWorkforce = scopedProjects.reduce((acc, p) => acc + p.assignedWorkforce, 0);
    const presentToday = scopedProjects.reduce((acc, p) => acc + p.presentToday, 0);
    const totalApprovedBudget = scopedProjects.reduce((acc, p) => acc + p.approvedBudgetInr, 0);
    const totalCommitted = scopedProjects.reduce((acc, p) => acc + p.committedCostInr, 0);
    const totalApprovedExp = scopedProjects.reduce((acc, p) => acc + p.approvedExpenditureInr, 0);
    const totalPaidExp = scopedProjects.reduce((acc, p) => acc + p.paidExpenditureInr, 0);
    const totalForecast = scopedProjects.reduce((acc, p) => acc + p.forecastedFinalCostInr, 0);

    return {
      totalAssigned,
      activeCount,
      onScheduleCount,
      delayedCount,
      avgCompletion,
      totalWorkforce,
      presentToday,
      totalApprovedBudget,
      totalCommitted,
      totalApprovedExp,
      totalPaidExp,
      totalForecast,
      remainingBudget: Math.max(0, totalApprovedBudget - totalApprovedExp),
    };
  }, [scopedProjects]);

  const filteredPortfolio = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = scopedProjects.filter((p) => {
      if (portfolioFilter !== "All" && p.status !== portfolioFilter) return false;
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.code.toLowerCase().includes(q) &&
        !p.location.toLowerCase().includes(q) &&
        !p.clientName.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortKey === "progress") return b.actualProgress - a.actualProgress;
      if (sortKey === "budget") return b.approvedBudgetInr - a.approvedBudgetInr;
      if (sortKey === "schedule") return a.scheduleVarianceDays - b.scheduleVarianceDays;
      return a.name.localeCompare(b.name);
    });
  }, [scopedProjects, portfolioFilter, searchQuery, sortKey]);

  const progressComparisonData = useMemo(
    () =>
      scopedProjects.map((p) => ({
        code: p.code.replace("BF-PRJ-", "PRJ-"),
        name: p.name,
        Planned: p.plannedProgress,
        Actual: p.actualProgress,
        Variance: p.actualProgress - p.plannedProgress,
      })),
    [scopedProjects]
  );

  const budgetChartData = useMemo(
    () =>
      scopedProjects.map((p) => ({
        code: p.code.replace("BF-PRJ-", "PRJ-"),
        Approved: Number((p.approvedBudgetInr / 10000000).toFixed(2)),
        Committed: Number((p.committedCostInr / 10000000).toFixed(2)),
        Paid: Number((p.paidExpenditureInr / 10000000).toFixed(2)),
        Forecast: Number((p.forecastedFinalCostInr / 10000000).toFixed(2)),
      })),
    [scopedProjects]
  );

  const workforceChartData = useMemo(
    () =>
      scopedProjects.map((p) => ({
        code: p.code.replace("BF-PRJ-", "PRJ-"),
        Required: p.requiredWorkforce,
        Assigned: p.assignedWorkforce,
        Present: p.presentToday,
      })),
    [scopedProjects]
  );

  const scopedActivities = useMemo(
    () =>
      (selectedProjectId === "ALL"
        ? activityLogs
        : activityLogs.filter((a) => a.projectId === selectedProjectId)
      ).slice(0, 7),
    [activityLogs, selectedProjectId]
  );

  const attendanceTotals = useMemo(() => {
    const present = scopedSites.reduce((acc, s) => acc + s.presentToday, 0);
    const absent = scopedSites.reduce((acc, s) => acc + s.absentToday, 0);
    const onLeave = scopedSites.reduce((acc, s) => acc + s.onLeaveToday, 0);
    const contractors = scopedProjects.reduce((acc, p) => acc + p.activeContractors, 0);
    return { present, absent, onLeave, contractors };
  }, [scopedSites, scopedProjects]);

  const pendingApprovalsCount = approvals.filter((a) => a.status === "Pending").length;
  const pendingDprsCount = dailyReports.filter((d) => d.reviewStatus === "Pending Review").length;

  const handleExportReport = () => {
    exportToCSV(
      `buildflow-pm-portfolio-${new Date().toISOString().slice(0, 10)}`,
      scopedProjects.map((p) => ({
        ProjectCode: p.code,
        ProjectName: p.name,
        Location: p.location,
        Status: p.status,
        Health: p.health,
        PlannedProgressPct: p.plannedProgress,
        ActualProgressPct: p.actualProgress,
        ScheduleVarianceDays: p.scheduleVarianceDays,
        ApprovedBudgetINR: p.approvedBudgetInr,
        CommittedCostINR: p.committedCostInr,
        ApprovedExpenseINR: p.approvedExpenditureInr,
        PaidExpenseINR: p.paidExpenditureInr,
        ForecastedFinalCostINR: p.forecastedFinalCostInr,
        AssignedWorkforce: p.assignedWorkforce,
        PresentToday: p.presentToday,
      }))
    );
    toast.success("Portfolio performance summary downloaded as CSV.");
  };

  return (
    <div className="space-y-6">
      {/* A. Welcome Header */}
      <div className="flex flex-col gap-4 border-b border-[#E2E8F0] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#172B4D] text-balance">
            Good Morning, Project Manager
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Here&apos;s the performance overview of your assigned construction projects.
          </p>
          <p className="mt-2 text-xs text-[#64748B] tabular-nums">
            Wednesday, 18 Nov 2026 · Period: {dateRange.toUpperCase()} ·{" "}
            {profile.assignedProjectIds.length} of 8 company projects assigned · Sample Data
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <select
            aria-label="Filter overview by project"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="h-10 rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs font-medium text-[#172B4D] focus:border-[#2563EB] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Assigned Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={() => navigate("/approvals")}>
            <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
            <span>Approvals ({pendingApprovalsCount})</span>
          </Button>
          <Button onClick={handleExportReport}>
            <Download className="h-4 w-4" />
            <span>Generate Report</span>
          </Button>
        </div>
      </div>

      {/* B. Portfolio KPI Cards (8 clickable cards) */}
      <section aria-label="Portfolio Key Performance Indicators">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={() => navigate("/projects")}
            className="group flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-4 text-left transition-colors hover:border-[#2563EB]/50 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">
                Total Assigned Projects
              </span>
              <FolderKanban className="h-4 w-4 text-[#2563EB]" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-[#172B4D] tabular-nums">
                {kpis.totalAssigned}
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs text-[#64748B] group-hover:text-[#2563EB]">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[#64748B]">
              {scopedSites.length} active construction sites · Sample Data
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate("/projects?status=Active")}
            className="group flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-4 text-left transition-colors hover:border-[#2563EB]/50 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">Active Projects</span>
              <HardHat className="h-4 w-4 text-[#2563EB]" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-[#172B4D] tabular-nums">
                {kpis.activeCount}
              </span>
              <span className="text-xs font-medium text-[#2563EB] tabular-nums">
                {pendingDprsCount} DPRs pending
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[#64748B]">
              In active execution phase · Sample Data
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate("/timeline")}
            className="group flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-4 text-left transition-colors hover:border-[#16A34A]/50 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">
                Projects On Schedule
              </span>
              <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-[#172B4D] tabular-nums">
                {kpis.onScheduleCount}
              </span>
              <span className="text-xs font-medium text-[#16A34A]">
                Baseline met
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[#64748B]">
              Schedule variance &ge; 0 days · Sample Data
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate("/issues")}
            className="group flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-4 text-left transition-colors hover:border-[#DC2626]/50 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">Delayed Projects</span>
              <AlertTriangle className="h-4 w-4 text-[#DC2626]" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-[#DC2626] tabular-nums">
                {kpis.delayedCount}
              </span>
              <span className="text-xs font-medium text-[#DC2626]">
                Needs intervention
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[#64748B]">
              Behind original baseline dates · Sample Data
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate("/comparison")}
            className="group flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-4 text-left transition-colors hover:border-[#2563EB]/50 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">
                Average Project Completion
              </span>
              <TrendingUp className="h-4 w-4 text-[#7C3AED]" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-[#172B4D] tabular-nums">
                {kpis.avgCompletion}%
              </span>
              <span className="text-xs text-[#64748B] tabular-nums">
                Compare projects
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#2563EB]"
                style={{ width: `${kpis.avgCompletion}%` }}
              />
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/workforce")}
            className="group flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-4 text-left transition-colors hover:border-[#2563EB]/50 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">
                Total Assigned Workforce
              </span>
              <Users className="h-4 w-4 text-[#2563EB]" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-[#172B4D] tabular-nums">
                {kpis.totalWorkforce}
              </span>
              <span className="text-xs font-medium text-[#16A34A] tabular-nums">
                {kpis.presentToday} present today
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[#64748B] tabular-nums">
              {kpis.totalWorkforce
                ? Math.round((kpis.presentToday / kpis.totalWorkforce) * 100)
                : 0}
              % attendance · Salary hidden by RBAC
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate("/budget")}
            className="group flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-4 text-left transition-colors hover:border-[#2563EB]/50 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">
                Total Approved Budget
              </span>
              <Wallet className="h-4 w-4 text-[#101F35]" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-[#172B4D] tabular-nums">
                {formatINR(kpis.totalApprovedBudget, true)}
              </span>
              <span className="text-xs text-[#64748B] tabular-nums">
                Forecast {formatINR(kpis.totalForecast, true)}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[#64748B] tabular-nums">
              Remaining: {formatINR(kpis.remainingBudget, true)} · Sample Data
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate("/budget")}
            className="group flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-4 text-left transition-colors hover:border-[#F59E0B]/60 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748B]">
                Total Project Expenditure
              </span>
              <CalendarClock className="h-4 w-4 text-[#F59E0B]" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-[#172B4D] tabular-nums">
                {formatINR(kpis.totalPaidExp, true)}
              </span>
              <span className="text-xs font-medium text-[#B45309] tabular-nums">
                Paid (settled)
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[#64748B] tabular-nums">
              Approved: {formatINR(kpis.totalApprovedExp, true)} · Committed:{" "}
              {formatINR(kpis.totalCommitted, true)}
            </p>
          </button>
        </div>
      </section>

      {/* C. Project Portfolio Overview */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#172B4D]">
              Project Portfolio Overview
            </h2>
            <p className="text-xs text-[#64748B]">
              Click any assigned project to open its 12-tab operational workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#64748B]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search project, code, client..."
                className="h-8.5 w-48 rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] pl-8 pr-3 text-xs text-[#172B4D] placeholder:text-[#64748B] focus:border-[#2563EB] focus:bg-white focus:outline-none"
              />
            </div>

            <select
              aria-label="Sort portfolio"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
              className="h-8.5 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#172B4D] cursor-pointer"
            >
              <option value="name">Sort: Name</option>
              <option value="progress">Sort: Highest Progress</option>
              <option value="budget">Sort: Highest Budget</option>
              <option value="schedule">Sort: Schedule Risk</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-4 flex items-center gap-1 overflow-x-auto pb-1">
          {["All", "Active", "On Track", "At Risk", "Delayed", "Completed"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setPortfolioFilter(st)}
              className={cn(
                "whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                portfolioFilter === st
                  ? "bg-[#101F35] text-white"
                  : "bg-slate-100 text-[#64748B] hover:text-[#172B4D]"
              )}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Desktop Compact Table / Mobile Cards */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="py-2.5 pr-4">Project</th>
                <th className="py-2.5 px-3">Client & Location</th>
                <th className="py-2.5 px-3">Timeline</th>
                <th className="py-2.5 px-3">Completion</th>
                <th className="py-2.5 px-3 text-right">Budget Used (Paid)</th>
                <th className="py-2.5 px-3 text-right">Workforce</th>
                <th className="py-2.5 pl-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {filteredPortfolio.map((p) => {
                const budgetPct = Math.round(
                  (p.paidExpenditureInr / p.approvedBudgetInr) * 100
                );
                return (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.thumbnailUrl}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="h-11 w-16 rounded-md object-cover border border-[#E2E8F0] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#172B4D] truncate">
                            {p.name}
                          </p>
                          <p className="text-xs text-[#64748B] font-mono">
                            {p.code} · {p.sitesCount} sites
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-xs font-medium text-[#172B4D]">
                        {p.clientName}
                      </p>
                      <p className="text-xs text-[#64748B]">{p.location}</p>
                    </td>
                    <td className="py-3 px-3 text-xs text-[#64748B] tabular-nums whitespace-nowrap">
                      <p>{formatDate(p.startDate)}</p>
                      <p>Due {formatDate(p.expectedCompletionDate)}</p>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              p.actualProgress < p.plannedProgress - 5
                                ? "bg-[#DC2626]"
                                : "bg-[#2563EB]"
                            )}
                            style={{ width: `${p.actualProgress}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-[#172B4D] tabular-nums">
                          {p.actualProgress}%
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#64748B] tabular-nums">
                        Plan {p.plannedProgress}% ({p.scheduleVarianceDays >= 0 ? "+" : ""}
                        {p.scheduleVarianceDays}d)
                      </p>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      <p className="text-xs font-semibold text-[#172B4D]">
                        {formatINR(p.paidExpenditureInr, true)} /{" "}
                        {formatINR(p.approvedBudgetInr, true)}
                      </p>
                      <p className="text-[11px] text-[#64748B]">{budgetPct}% paid</p>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      <p className="text-xs font-semibold text-[#172B4D]">
                        {p.presentToday} / {p.assignedWorkforce}
                      </p>
                      <p className="text-[11px] text-[#64748B]">present today</p>
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <StatusIndicator label={p.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Project Cards */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {filteredPortfolio.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate(`/projects/${p.id}`)}
              className="flex flex-col gap-3 rounded-lg border border-[#E2E8F0] p-3.5 text-left hover:bg-slate-50 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-[#64748B]">
                    {p.code} · {p.location}
                  </p>
                  <p className="mt-0.5 font-semibold text-[#172B4D]">{p.name}</p>
                </div>
                <StatusIndicator label={p.status} />
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-[#E2E8F0] pt-2.5 text-xs tabular-nums">
                <div>
                  <span className="text-[#64748B] block">Progress</span>
                  <span className="font-semibold text-[#172B4D]">
                    {p.actualProgress}% / {p.plannedProgress}%
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Paid / Budget</span>
                  <span className="font-semibold text-[#172B4D]">
                    {formatINR(p.paidExpenditureInr, true)}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Workforce</span>
                  <span className="font-semibold text-[#172B4D]">
                    {p.presentToday}/{p.assignedWorkforce}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* D & E. Progress Analytics + Budget Overview */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Progress Analytics */}
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#172B4D]">
                Project Progress Analytics (Planned vs Actual)
              </h2>
              <p className="text-xs text-[#64748B]">
                Variance highlights projects lagging baseline progress rules.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/timeline")}
            >
              Timeline
            </Button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={progressComparisonData}
                margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="code" tick={{ fontSize: 12, fill: "#64748B" }} />
                <YAxis
                  unit="%"
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: "#64748B" }}
                />
                <Tooltip
                  formatter={(value) => [`${value ?? 0}%`, ""]}
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "#E2E8F0",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Planned" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 border-t border-[#E2E8F0] pt-3">
            <p className="mb-2 text-xs font-medium text-[#64748B]">
              Portfolio 6-Month Cumulative Progress Trend (Sample Data)
            </p>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={PHASE_PROGRESS_SERIES}
                  margin={{ top: 4, right: 12, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="reportDate"
                    tick={{ fontSize: 11, fill: "#64748B" }}
                  />
                  <YAxis unit="%" tick={{ fontSize: 11, fill: "#64748B" }} />
                  <Tooltip formatter={(v) => `${v ?? 0}%`} />
                  <Line
                    type="monotone"
                    dataKey="planned"
                    name="Planned %"
                    stroke="#64748B"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual %"
                    stroke="#2563EB"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Budget Overview */}
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#172B4D]">
                Project Budget Overview (₹ Crores)
              </h2>
              <p className="text-xs text-[#64748B]">
                Committed costs and approved expenses remain separate from paid settlements.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/budget")}
            >
              Cost Control
            </Button>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 border-b border-[#E2E8F0] pb-4 text-xs tabular-nums">
            <div>
              <span className="text-[#64748B]">Approved Budget</span>
              <p className="mt-0.5 text-sm font-semibold text-[#172B4D]">
                {formatINR(kpis.totalApprovedBudget, true)}
              </p>
            </div>
            <div>
              <span className="text-[#64748B]">Committed Cost (POs)</span>
              <p className="mt-0.5 text-sm font-semibold text-[#7C3AED]">
                {formatINR(kpis.totalCommitted, true)}
              </p>
            </div>
            <div>
              <span className="text-[#64748B]">Approved Expense</span>
              <p className="mt-0.5 text-sm font-semibold text-[#2563EB]">
                {formatINR(kpis.totalApprovedExp, true)}
              </p>
            </div>
            <div>
              <span className="text-[#64748B]">Paid Expense</span>
              <p className="mt-0.5 text-sm font-semibold text-[#16A34A]">
                {formatINR(kpis.totalPaidExp, true)}
              </p>
            </div>
            <div>
              <span className="text-[#64748B]">Remaining Budget</span>
              <p className="mt-0.5 text-sm font-semibold text-[#172B4D]">
                {formatINR(kpis.remainingBudget, true)}
              </p>
            </div>
            <div>
              <span className="text-[#64748B]">Forecasted Final</span>
              <p
                className={cn(
                  "mt-0.5 text-sm font-semibold",
                  kpis.totalForecast > kpis.totalApprovedBudget
                    ? "text-[#DC2626]"
                    : "text-[#16A34A]"
                )}
              >
                {formatINR(kpis.totalForecast, true)}
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={budgetChartData}
                margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="code" tick={{ fontSize: 12, fill: "#64748B" }} />
                <YAxis unit=" Cr" tick={{ fontSize: 12, fill: "#64748B" }} />
                <Tooltip
                  formatter={(v) => [`₹${v ?? 0} Cr`, ""]}
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "#E2E8F0",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Approved" fill="#101F35" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Committed" fill="#7C3AED" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Paid" fill="#16A34A" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Forecast" fill="#F59E0B" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* F & G. Workforce Overview + Project Health Overview */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Workforce Overview */}
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#172B4D]">
                Workforce Deployment & Attendance Summary
              </h2>
              <p className="text-xs text-[#64748B]">
                Assigned headcount across sites · Salary records restricted by Company Admin.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/workforce")}
            >
              Workforce
            </Button>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 border-b border-[#E2E8F0] pb-4 text-xs tabular-nums">
            <div>
              <span className="text-[#64748B]">Present Today</span>
              <p className="mt-0.5 text-lg font-semibold text-[#16A34A]">
                {attendanceTotals.present}
              </p>
            </div>
            <div>
              <span className="text-[#64748B]">Absent</span>
              <p className="mt-0.5 text-lg font-semibold text-[#DC2626]">
                {attendanceTotals.absent}
              </p>
            </div>
            <div>
              <span className="text-[#64748B]">On Leave</span>
              <p className="mt-0.5 text-lg font-semibold text-[#B45309]">
                {attendanceTotals.onLeave}
              </p>
            </div>
            <div>
              <span className="text-[#64748B]">Active Contractors</span>
              <p className="mt-0.5 text-lg font-semibold text-[#172B4D]">
                {attendanceTotals.contractors}
              </p>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={workforceChartData}
                margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="code" tick={{ fontSize: 12, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Required" fill="#CBD5E1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Assigned" fill="#2563EB" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Present" fill="#16A34A" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Project Health Overview */}
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#172B4D]">
                Project Health & Rule-Based Diagnostics
              </h2>
              <p className="text-xs text-[#64748B]">
                Calculated transparently from schedule variance, cost forecast, shortages, and issues.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/settings")}
            >
              Configure Rules
            </Button>
          </div>

          <div className="divide-y divide-[#E2E8F0]">
            {scopedProjects.map((p) => (
              <div key={p.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="text-sm font-semibold text-[#172B4D] hover:text-[#2563EB] text-left cursor-pointer"
                  >
                    {p.name}
                  </button>
                  <StatusIndicator
                    label={p.health}
                    tone={
                      p.health === ProjectHealthStatus.HEALTHY
                        ? "success"
                        : p.health === ProjectHealthStatus.NEEDS_ATTENTION
                          ? "warning"
                          : "danger"
                    }
                  />
                </div>
                <p className="mt-1 text-xs text-[#64748B]">
                  {p.healthFactors[0]?.indicator}: {p.healthFactors[0]?.explanation}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* H. Recent Project Activities */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#2563EB]" />
            <h2 className="text-base font-semibold text-[#172B4D]">
              Recent Project Activities
            </h2>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate("/daily-reports")}
          >
            Open Daily Reports
          </Button>
        </div>

        <div className="divide-y divide-[#E2E8F0]">
          {scopedActivities.map((act) => (
            <div
              key={act.id}
              className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm text-[#172B4D]">
                  <span className="font-semibold">{act.user}</span>{" "}
                  <span className="text-xs text-[#64748B]">({act.userRole})</span> —{" "}
                  {act.action}
                </p>
                <p className="mt-0.5 text-xs text-[#64748B]">
                  <Building2 className="mr-1 inline h-3 w-3" />
                  {act.projectName} · {act.siteName}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusIndicator label={act.statusLabel} />
                <span className="inline-flex items-center gap-1 text-xs text-[#64748B] tabular-nums">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(act.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
