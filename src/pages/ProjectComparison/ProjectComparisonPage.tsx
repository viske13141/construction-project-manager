import { useMemo, useState } from "react";
import { Download, Trophy, AlertTriangle } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePMStore } from "../../store/pmStore";
import { cn, exportToCSV, formatINR } from "../../lib/utils";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatusIndicator } from "../../components/shared/StatusIndicator";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

export function ProjectComparisonPage() {
  const { projects, milestones, issues, materialRequests, equipment, approvals } =
    usePMStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([
    "prj-001",
    "prj-002",
    "prj-003",
    "prj-004",
  ]);

  const toggleProject = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 2) {
          toast.info("Select at least 2 projects for side-by-side comparison.");
          return prev;
        }
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 5) {
        toast.info("Maximum 5 projects can be compared simultaneously.");
        return prev;
      }
      return [...prev, id];
    });
  };

  const compared = useMemo(
    () => projects.filter((p) => selectedIds.includes(p.id)),
    [projects, selectedIds]
  );

  const enriched = useMemo(
    () =>
      compared.map((p) => {
        const delayedMs = milestones.filter(
          (m) => m.projectId === p.id && ["Delayed", "Blocked"].includes(m.status)
        ).length;
        const openIss = issues.filter(
          (i) => i.projectId === p.id && !["Resolved", "Closed"].includes(i.status)
        ).length;
        const criticalSafety = issues.filter(
          (i) =>
            i.projectId === p.id &&
            i.category === "Safety incident" &&
            !["Resolved", "Closed"].includes(i.status)
        ).length;
        const matShortages = materialRequests.filter(
          (m) => m.projectId === p.id && m.currentSiteStock < m.minimumThreshold
        ).length;
        const eqDowntime = equipment
          .filter((e) => e.projectId === p.id)
          .reduce((acc, e) => acc + e.downtimeHours30d, 0);
        const pendingApr = approvals.filter(
          (a) => a.projectId === p.id && a.status === "Pending"
        ).length;
        const attendancePct = p.assignedWorkforce
          ? Math.round((p.presentToday / p.assignedWorkforce) * 100)
          : 0;
        const workforceShortage = Math.max(0, p.requiredWorkforce - p.assignedWorkforce);
        const budgetUtilPct = Math.round(
          (p.paidExpenditureInr / p.approvedBudgetInr) * 100
        );
        const remainingBudget = Math.max(
          0,
          p.approvedBudgetInr - p.approvedExpenditureInr
        );

        return {
          ...p,
          delayedMs,
          openIss,
          criticalSafety,
          matShortages,
          eqDowntime,
          pendingApr,
          attendancePct,
          workforceShortage,
          budgetUtilPct,
          remainingBudget,
        };
      }),
    [compared, milestones, issues, materialRequests, equipment, approvals]
  );

  const bestProgressId = useMemo(() => {
    if (!enriched.length) return "";
    return [...enriched].sort((a, b) => b.scheduleVarianceDays - a.scheduleVarianceDays)[0].id;
  }, [enriched]);

  const worstScheduleId = useMemo(() => {
    if (!enriched.length) return "";
    return [...enriched].sort((a, b) => a.scheduleVarianceDays - b.scheduleVarianceDays)[0].id;
  }, [enriched]);

  const chartData = enriched.map((p) => ({
    name: p.code.replace("BF-PRJ-", "PRJ-"),
    Planned: p.plannedProgress,
    Actual: p.actualProgress,
    Attendance: p.attendancePct,
    BudgetPaid: p.budgetUtilPct,
  }));

  const handleExport = () => {
    exportToCSV(
      `buildflow-project-comparison-${new Date().toISOString().slice(0, 10)}`,
      enriched.map((p) => ({
        Code: p.code,
        Project: p.name,
        PlannedPct: p.plannedProgress,
        ActualPct: p.actualProgress,
        ScheduleVarianceDays: p.scheduleVarianceDays,
        ApprovedBudgetINR: p.approvedBudgetInr,
        CommittedCostINR: p.committedCostInr,
        PaidExpenseINR: p.paidExpenditureInr,
        ForecastedCostINR: p.forecastedFinalCostInr,
        AttendancePct: p.attendancePct,
        WorkforceShortage: p.workforceShortage,
        OpenIssues: p.openIss,
        EquipmentDowntimeHrs: p.eqDowntime,
      }))
    );
    toast.success("Project comparison matrix exported as CSV.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Overview", to: "/" }, { label: "Project Comparison" }]}
        title="Side-by-Side Project Comparison"
        subtitle="Compare 2 to 5 assigned projects across schedule, financial separation, workforce deployment, and site operations."
        meta={`Comparing ${compared.length} assigned projects · Missing/restricted contract values shown as Unavailable · Sample Data`}
        actions={
          <Button onClick={handleExport}>
            <Download className="h-4 w-4" />
            <span>Export Comparison CSV</span>
          </Button>
        }
      />

      {/* Project Selection Bar */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
        <p className="mb-2.5 text-xs font-semibold text-[#172B4D]">
          Select Projects to Compare (2–5 Assigned Projects)
        </p>
        <div className="flex flex-wrap gap-2">
          {projects.map((p) => {
            const active = selectedIds.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleProject(p.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors cursor-pointer",
                  active
                    ? "border-[#2563EB] bg-[#2563EB]/8 text-[#101F35]"
                    : "border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#172B4D]"
                )}
              >
                <span className="font-mono">{p.code}</span>
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Visual Chart */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-[#172B4D]">
          Progress, Attendance & Budget Paid % Comparison
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} />
              <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748B" }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Planned" fill="#94A3B8" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Actual" fill="#2563EB" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Attendance" fill="#16A34A" radius={[3, 3, 0, 0]} />
              <Bar dataKey="BudgetPaid" fill="#F59E0B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
        <table className="w-full text-left border-collapse text-xs tabular-nums">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F5F7FA]">
              <th className="py-3.5 px-4 font-semibold text-[#172B4D] min-w-[210px]">
                Performance Indicator
              </th>
              {enriched.map((p) => (
                <th key={p.id} className="py-3.5 px-4 min-w-[190px]">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-[11px] text-[#64748B]">{p.code}</p>
                      <p className="font-semibold text-[#172B4D]">{p.name}</p>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <StatusIndicator label={p.status} />
                    {p.id === bestProgressId && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#16A34A]">
                        <Trophy className="h-3 w-3" /> Strongest Schedule
                      </span>
                    )}
                    {p.id === worstScheduleId && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#DC2626]">
                        <AlertTriangle className="h-3 w-3" /> Highest Delay
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E2E8F0]">
            {/* Schedule Performance */}
            <tr className="bg-slate-50/70">
              <td
                colSpan={enriched.length + 1}
                className="py-2 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]"
              >
                Schedule Performance
              </td>
            </tr>
            <tr>
              <td className="py-2.5 px-4 font-medium text-[#172B4D]">Planned vs Actual Progress</td>
              {enriched.map((p) => (
                <td key={p.id} className="py-2.5 px-4">
                  <span className="font-semibold text-[#172B4D]">{p.actualProgress}%</span>{" "}
                  <span className="text-[#64748B]">/ {p.plannedProgress}% planned</span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2.5 px-4 font-medium text-[#172B4D]">Days Ahead / Behind</td>
              {enriched.map((p) => (
                <td
                  key={p.id}
                  className={cn(
                    "py-2.5 px-4 font-semibold",
                    p.scheduleVarianceDays >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"
                  )}
                >
                  {p.scheduleVarianceDays >= 0
                    ? `+${p.scheduleVarianceDays} days ahead`
                    : `${p.scheduleVarianceDays} days behind`}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2.5 px-4 font-medium text-[#172B4D]">Delayed / Blocked Milestones</td>
              {enriched.map((p) => (
                <td key={p.id} className="py-2.5 px-4">
                  {p.delayedMs}
                </td>
              ))}
            </tr>

            {/* Financial Performance */}
            <tr className="bg-slate-50/70">
              <td
                colSpan={enriched.length + 1}
                className="py-2 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]"
              >
                Financial Performance
              </td>
            </tr>
            <tr>
              <td className="py-2.5 px-4 font-medium text-[#172B4D]">Approved Budget</td>
              {enriched.map((p) => (
                <td key={p.id} className="py-2.5 px-4 font-semibold">
                  {formatINR(p.approvedBudgetInr, true)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2.5 px-4 font-medium text-[#172B4D]">Committed Cost (POs)</td>
              {enriched.map((p) => (
                <td key={p.id} className="py-2.5 px-4 text-[#7C3AED]">
                  {formatINR(p.committedCostInr, true)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2.5 px-4 font-medium text-[#172B4D]">Approved vs Paid Expenditure</td>
              {enriched.map((p) => (
                <td key={p.id} className="py-2.5 px-4">
                  <span className="text-[#2563EB]">{formatINR(p.approvedExpenditureInr, true)}</span>{" "}
                  /{" "}
                  <span className="font-semibold text-[#16A34A]">
                    {formatINR(p.paidExpenditureInr, true)} paid
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2.5 px-4 font-medium text-[#172B4D]">Forecasted Final Cost</td>
              {enriched.map((p) => (
                <td
                  key={p.id}
                  className={cn(
                    "py-2.5 px-4 font-semibold",
                    p.forecastedFinalCostInr > p.revisedBudgetInr
                      ? "text-[#DC2626]"
                      : "text-[#16A34A]"
                  )}
                >
                  {formatINR(p.forecastedFinalCostInr, true)}
                </td>
              ))}
            </tr>

            {/* Workforce Performance */}
            <tr className="bg-slate-50/70">
              <td
                colSpan={enriched.length + 1}
                className="py-2 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]"
              >
                Workforce Performance
              </td>
            </tr>
            <tr>
              <td className="py-2.5 px-4 font-medium text-[#172B4D]">Assigned Workers & Attendance</td>
              {enriched.map((p) => (
                <td key={p.id} className="py-2.5 px-4">
                  {p.assignedWorkforce} assigned ·{" "}
                  <span className="font-semibold">{p.attendancePct}% present</span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2.5 px-4 font-medium text-[#172B4D]">Workforce Shortage</td>
              {enriched.map((p) => (
                <td
                  key={p.id}
                  className={cn(
                    "py-2.5 px-4 font-semibold",
                    p.workforceShortage > 0 ? "text-[#DC2626]" : "text-[#16A34A]"
                  )}
                >
                  {p.workforceShortage > 0 ? `${p.workforceShortage} short` : "No shortage"}
                </td>
              ))}
            </tr>

            {/* Operational Performance */}
            <tr className="bg-slate-50/70">
              <td
                colSpan={enriched.length + 1}
                className="py-2 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]"
              >
                Operational Performance
              </td>
            </tr>
            <tr>
              <td className="py-2.5 px-4 font-medium text-[#172B4D]">Open Issues / Critical Safety</td>
              {enriched.map((p) => (
                <td key={p.id} className="py-2.5 px-4">
                  {p.openIss} open ·{" "}
                  <span className={p.criticalSafety > 0 ? "text-[#DC2626] font-semibold" : ""}>
                    {p.criticalSafety} safety
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2.5 px-4 font-medium text-[#172B4D]">Material Shortages / Eq. Downtime</td>
              {enriched.map((p) => (
                <td key={p.id} className="py-2.5 px-4">
                  {p.matShortages} shortages · {p.eqDowntime}h downtime
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2.5 px-4 font-medium text-[#172B4D]">Pending Approvals</td>
              {enriched.map((p) => (
                <td key={p.id} className="py-2.5 px-4 font-semibold">
                  {p.pendingApr} waiting
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
