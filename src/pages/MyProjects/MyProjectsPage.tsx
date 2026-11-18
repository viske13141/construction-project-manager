import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Building2,
  Calendar,
  LayoutGrid,
  List,
  MapPin,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { usePMStore } from "../../store/pmStore";
import { cn, formatDate, formatINR } from "../../lib/utils";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatusIndicator } from "../../components/shared/StatusIndicator";
import { EmptyState } from "../../components/shared/EmptyState";
import { Button } from "../../components/ui/button";

export function MyProjectsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projects, sites, issues, tasks, profile } = usePMStore();

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [healthFilter, setHealthFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [completionFilter, setCompletionFilter] = useState("All");
  const [budgetFilter, setBudgetFilter] = useState("All");

  const clients = useMemo(
    () => Array.from(new Set(projects.map((p) => p.clientName))),
    [projects]
  );
  const locations = useMemo(
    () => Array.from(new Set(projects.map((p) => p.location.split(",").pop()?.trim() || p.location))),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== "All" && p.status !== statusFilter) return false;
      if (typeFilter !== "All" && p.type !== typeFilter) return false;
      if (healthFilter !== "All" && p.health !== healthFilter) return false;
      if (clientFilter !== "All" && p.clientName !== clientFilter) return false;
      if (locationFilter !== "All" && !p.location.includes(locationFilter)) return false;

      if (completionFilter === "0-40" && p.actualProgress > 40) return false;
      if (completionFilter === "41-75" && (p.actualProgress <= 40 || p.actualProgress > 75))
        return false;
      if (completionFilter === "76-100" && p.actualProgress <= 75) return false;

      const util = Math.round((p.paidExpenditureInr / p.approvedBudgetInr) * 100);
      if (budgetFilter === "under50" && util >= 50) return false;
      if (budgetFilter === "50-85" && (util < 50 || util > 85)) return false;
      if (budgetFilter === "over85" && util <= 85) return false;

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
  }, [
    projects,
    search,
    statusFilter,
    typeFilter,
    healthFilter,
    clientFilter,
    locationFilter,
    completionFilter,
    budgetFilter,
  ]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setTypeFilter("All");
    setHealthFilter("All");
    setClientFilter("All");
    setLocationFilter("All");
    setCompletionFilter("All");
    setBudgetFilter("All");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Overview", to: "/" }, { label: "My Projects" }]}
        title="My Assigned Projects"
        subtitle="Central workspace for all construction projects explicitly assigned to your Project Manager scope."
        meta={`Showing ${filteredProjects.length} of ${projects.length} assigned projects (3 unassigned company projects restricted by RBAC) · Sample Data`}
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                viewMode === "grid"
                  ? "bg-[#101F35] text-white"
                  : "text-[#64748B] hover:text-[#172B4D]"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Grid View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                viewMode === "table"
                  ? "bg-[#101F35] text-white"
                  : "text-[#64748B] hover:text-[#172B4D]"
              )}
            >
              <List className="h-3.5 w-3.5" />
              <span>Table View</span>
            </button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, code, client..."
              className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] pl-9 pr-3 text-xs text-[#172B4D] focus:border-[#2563EB] focus:bg-white focus:outline-none"
            />
          </div>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#172B4D]"
          >
            <option value="All">Status: All</option>
            <option value="Active">Active</option>
            <option value="On Track">On Track</option>
            <option value="At Risk">At Risk</option>
            <option value="Delayed">Delayed</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            aria-label="Filter by project type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#172B4D]"
          >
            <option value="All">Project Type: All</option>
            <option value="Commercial Construction">Commercial Construction</option>
            <option value="Residential Construction">Residential Construction</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Industrial & Logistics">Industrial & Logistics</option>
          </select>

          <select
            aria-label="Filter by health"
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value)}
            className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#172B4D]"
          >
            <option value="All">Health: All</option>
            <option value="Healthy">Healthy</option>
            <option value="Needs Attention">Needs Attention</option>
            <option value="Critical">Critical</option>
          </select>

          <select
            aria-label="Filter by client"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#172B4D]"
          >
            <option value="All">Client: All</option>
            {clients.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by location"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#172B4D]"
          >
            <option value="All">State / Region: All</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by completion range"
            value={completionFilter}
            onChange={(e) => setCompletionFilter(e.target.value)}
            className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#172B4D]"
          >
            <option value="All">Completion: Any</option>
            <option value="0-40">0% – 40%</option>
            <option value="41-75">41% – 75%</option>
            <option value="76-100">76% – 100%</option>
          </select>

          <div className="flex items-center gap-2">
            <select
              aria-label="Filter by budget utilization"
              value={budgetFilter}
              onChange={(e) => setBudgetFilter(e.target.value)}
              className="h-9 flex-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#172B4D]"
            >
              <option value="All">Budget Paid: Any</option>
              <option value="under50">Under 50%</option>
              <option value="50-85">50% – 85%</option>
              <option value="over85">Over 85%</option>
            </select>
            <Button size="sm" variant="ghost" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          title="No assigned projects match those filters"
          description="Try clearing one or more status, client, or completion range filters."
          actionLabel="Reset All Filters"
          onAction={resetFilters}
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filteredProjects.map((p) => {
            const pSites = sites.filter((s) => s.projectId === p.id);
            const pOpenIssues = issues.filter(
              (i) => i.projectId === p.id && !["Resolved", "Closed"].includes(i.status)
            ).length;
            const pTasks = tasks.filter((t) => t.projectId === p.id);
            const delayedTasks = pTasks.filter((t) => t.status === "Delayed" || t.status === "Blocked").length;
            const paidPct = Math.round((p.paidExpenditureInr / p.approvedBudgetInr) * 100);

            return (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="group overflow-hidden rounded-xl border border-[#E2E8F0] bg-white transition-colors hover:border-[#2563EB]/60 cursor-pointer flex flex-col"
              >
                <div className="relative h-44 w-full overflow-hidden bg-slate-200">
                  <img
                    src={p.thumbnailUrl}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101F35]/80 via-[#101F35]/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-xs font-mono text-slate-200">
                        {p.code} · {p.type}
                      </p>
                      <h3 className="text-base font-semibold text-white">
                        {p.name}
                      </h3>
                    </div>
                    <StatusIndicator label={p.status} />
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748B]">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" /> {p.clientName}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {p.location}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] line-clamp-2">
                      {p.description}
                    </p>
                  </div>

                  {/* Operational & Performance Matrix */}
                  <div className="grid grid-cols-2 gap-3 border-y border-[#E2E8F0] py-3 text-xs tabular-nums sm:grid-cols-4">
                    <div>
                      <span className="text-[#64748B]">Actual / Plan</span>
                      <p className="mt-0.5 font-semibold text-[#172B4D]">
                        {p.actualProgress}% / {p.plannedProgress}%
                      </p>
                    </div>
                    <div>
                      <span className="text-[#64748B]">Approved Budget</span>
                      <p className="mt-0.5 font-semibold text-[#172B4D]">
                        {formatINR(p.approvedBudgetInr, true)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#64748B]">Workforce</span>
                      <p className="mt-0.5 font-semibold text-[#172B4D]">
                        {p.presentToday} / {p.assignedWorkforce}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#64748B]">Sites / Issues</span>
                      <p className="mt-0.5 font-semibold text-[#172B4D]">
                        {pSites.length} sites · {pOpenIssues} open
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3 text-[#64748B] tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Due {formatDate(p.expectedCompletionDate)}
                      </span>
                      <span>·</span>
                      <span>{paidPct}% paid</span>
                      {delayedTasks > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-[#DC2626] font-medium">
                            {delayedTasks} delayed tasks
                          </span>
                        </>
                      )}
                    </div>
                    <StatusIndicator label={p.health} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F5F7FA] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-3">Client & Location</th>
                <th className="py-3 px-3">Contract Value</th>
                <th className="py-3 px-3">Progress (Act/Plan)</th>
                <th className="py-3 px-3">Approved Budget</th>
                <th className="py-3 px-3">Sites & Workforce</th>
                <th className="py-3 px-3">Health</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {filteredProjects.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="hover:bg-slate-50 cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <p className="font-semibold text-[#172B4D]">{p.name}</p>
                    <p className="font-mono text-[#64748B]">{p.code}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="text-[#172B4D]">{p.clientName}</p>
                    <p className="text-[#64748B]">{p.location}</p>
                  </td>
                  <td className="py-3 px-3 tabular-nums">
                    {p.contractValueInr !== null ? (
                      <span className="font-medium text-[#172B4D]">
                        {formatINR(p.contractValueInr, true)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#64748B]">
                        <ShieldCheck className="h-3.5 w-3.5" /> Restricted
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 tabular-nums">
                    <span className="font-semibold text-[#172B4D]">
                      {p.actualProgress}%
                    </span>{" "}
                    / {p.plannedProgress}% ({p.scheduleVarianceDays >= 0 ? "+" : ""}
                    {p.scheduleVarianceDays}d)
                  </td>
                  <td className="py-3 px-3 tabular-nums">
                    <p className="font-semibold text-[#172B4D]">
                      {formatINR(p.approvedBudgetInr, true)}
                    </p>
                    <p className="text-[#64748B]">
                      Paid {formatINR(p.paidExpenditureInr, true)}
                    </p>
                  </td>
                  <td className="py-3 px-3 tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-[#64748B]" />
                      {p.presentToday}/{p.assignedWorkforce} · {p.sitesCount} sites
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <StatusIndicator label={p.health} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <StatusIndicator label={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Explicit RBAC Footer Note */}
      <div className="flex items-center gap-2 text-xs text-[#64748B]">
        <ShieldCheck className="h-4 w-4 text-[#2563EB] shrink-0" />
        <span>
          Scope Enforcement: Showing only projects assigned to {profile.name} ({profile.employeeCode}). Company-wide unassigned projects and payroll sheets remain isolated.
        </span>
      </div>
    </div>
  );
}
