import { useMemo, useState } from "react";
import { Download, FileBarChart2, Printer } from "lucide-react";
import { usePMStore } from "../../store/pmStore";
import { exportToCSV, formatINR } from "../../lib/utils";
import { PageHeader } from "../../components/shared/PageHeader";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

const REPORT_TEMPLATES = [
  "Project Progress Report",
  "Project Delay Report",
  "Budget Utilization Report",
  "Project Cost Variance Report",
  "Workforce Deployment Report",
  "Workforce Attendance Report",
  "Site Performance Report",
  "Milestone Completion Report",
  "Material Consumption Report",
  "Equipment Utilization Report",
  "Project Risk Report",
  "Daily Progress Summary",
  "Contractor Performance Report",
] as const;

export function ReportsAnalyticsPage() {
  const { projects, sites, milestones, issues, materialRequests, equipment, dailyReports } =
    usePMStore();

  const [selectedReport, setSelectedReport] = useState<string>(REPORT_TEMPLATES[0]);
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [siteFilter, setSiteFilter] = useState("ALL");
  const [periodLabel, setPeriodLabel] = useState("Nov 2026 (Last 30 Days)");

  const availableSites = useMemo(
    () =>
      projectFilter === "ALL"
        ? sites
        : sites.filter((s) => s.projectId === projectFilter),
    [sites, projectFilter]
  );

  const scopedProjects = useMemo(
    () =>
      projectFilter === "ALL"
        ? projects
        : projects.filter((p) => p.id === projectFilter),
    [projects, projectFilter]
  );

  const previewRows = useMemo(() => {
    if (selectedReport === "Budget Utilization Report" || selectedReport === "Project Cost Variance Report") {
      return scopedProjects.map((p) => ({
        Code: p.code,
        Project: p.name,
        ApprovedBudgetActual: formatINR(p.approvedBudgetInr, true),
        CommittedCostEstimate: formatINR(p.committedCostInr, true),
        PaidActual: formatINR(p.paidExpenditureInr, true),
        ForecastedFinalCost: formatINR(p.forecastedFinalCostInr, true),
        VarianceVsRevised: formatINR(p.revisedBudgetInr - p.forecastedFinalCostInr, true),
      }));
    }
    if (selectedReport === "Site Performance Report" || selectedReport === "Workforce Attendance Report") {
      return availableSites
        .filter((s) => siteFilter === "ALL" || s.id === siteFilter)
        .map((s) => ({
          SiteCode: s.code,
          SiteName: s.name,
          SiteManager: s.siteManager,
          PresentActual: `${s.presentToday}/${s.assignedWorkforce}`,
          PlannedProgress: `${s.plannedProgress}%`,
          ActualProgress: `${s.actualProgress}%`,
          HealthStatus: s.health,
        }));
    }
    if (selectedReport === "Milestone Completion Report") {
      return milestones
        .filter((m) => projectFilter === "ALL" || m.projectId === projectFilter)
        .map((m) => ({
          Project: m.projectName,
          Milestone: m.name,
          OriginalBaseline: m.originalPlannedDate,
          RevisedOrActual: m.actualCompletionDate || m.revisedDate || "On Baseline",
          CompletionPct: `${m.completionPercent}%`,
          Status: m.status,
        }));
    }
    if (selectedReport === "Equipment Utilization Report") {
      return equipment
        .filter((e) => projectFilter === "ALL" || e.projectId === projectFilter)
        .map((e) => ({
          Code: e.equipmentCode,
          Equipment: e.name,
          Site: e.siteName,
          Utilization: `${e.utilizationPercent}%`,
          Downtime30d: `${e.downtimeHours30d} hrs`,
          Availability: e.availability,
        }));
    }
    if (selectedReport === "Material Consumption Report") {
      return materialRequests
        .filter((m) => projectFilter === "ALL" || m.projectId === projectFilter)
        .map((m) => ({
          Request: m.requestNumber,
          Material: m.materialName,
          Site: m.siteName,
          RequestedQty: `${m.quantity} ${m.unit}`,
          CurrentStock: `${m.currentSiteStock} ${m.unit}`,
          DeliveryStatus: m.deliveryStatus,
        }));
    }
    if (selectedReport === "Project Risk Report") {
      return issues
        .filter((i) => projectFilter === "ALL" || i.projectId === projectFilter)
        .map((i) => ({
          IssueCode: i.issueCode,
          Title: i.title,
          Project: i.projectName,
          Category: i.category,
          Severity: i.severity,
          Status: i.status,
        }));
    }
    if (selectedReport === "Daily Progress Summary") {
      return dailyReports
        .filter((r) => projectFilter === "ALL" || r.projectId === projectFilter)
        .map((r) => ({
          ReportCode: r.reportCode,
          Date: r.reportingDate,
          Site: r.siteName,
          WorkforcePresent: r.workforcePresent,
          DailyGain: `+${r.dailyProgressPercent}%`,
          ReviewStatus: r.reviewStatus,
        }));
    }

    return scopedProjects.map((p) => ({
      Code: p.code,
      Project: p.name,
      PlannedProgress: `${p.plannedProgress}%`,
      ActualProgress: `${p.actualProgress}%`,
      ScheduleVariance: `${p.scheduleVarianceDays} days`,
      Workforce: `${p.presentToday}/${p.assignedWorkforce}`,
      Status: p.status,
    }));
  }, [
    selectedReport,
    scopedProjects,
    availableSites,
    siteFilter,
    milestones,
    equipment,
    materialRequests,
    issues,
    dailyReports,
    projectFilter,
  ]);

  const headers = previewRows.length > 0 ? Object.keys(previewRows[0]) : [];

  const handleExportCSV = () => {
    exportToCSV(
      selectedReport.toLowerCase().replace(/\s+/g, "-"),
      previewRows as Record<string, unknown>[]
    );
    toast.success(`${selectedReport} exported as CSV.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Overview", to: "/" }, { label: "Reports & Analytics" }]}
        title="Project Reports & Analytics Centre"
        subtitle="Generate standardized construction reports using identical underlying metrics as your portfolio dashboard."
        meta="Data Integrity: Actual recorded metrics, PO estimates, and final cost forecasts are labelled separately · Sample Data"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              <span>Export PDF</span>
            </Button>
            <Button onClick={handleExportCSV}>
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 13 Report Selector List */}
        <div className="lg:col-span-4 rounded-xl border border-[#E2E8F0] bg-white p-4 space-y-2">
          <h2 className="px-2 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            13 Report Templates
          </h2>
          <div className="space-y-1">
            {REPORT_TEMPLATES.map((tpl) => (
              <button
                key={tpl}
                type="button"
                onClick={() => setSelectedReport(tpl)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors cursor-pointer ${
                  selectedReport === tpl
                    ? "bg-[#101F35] text-white"
                    : "text-[#172B4D] hover:bg-slate-50"
                }`}
              >
                <FileBarChart2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{tpl}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Report Config & Live Preview */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 sm:grid-cols-3">
            <select
              aria-label="Report project filter"
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setSiteFilter("ALL");
              }}
              className="h-9 rounded-lg border border-[#E2E8F0] px-2.5 text-xs"
            >
              <option value="ALL">All Assigned Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Report site filter"
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="h-9 rounded-lg border border-[#E2E8F0] px-2.5 text-xs"
            >
              <option value="ALL">All Sites</option>
              {availableSites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} · {s.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Report period"
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              className="h-9 rounded-lg border border-[#E2E8F0] px-2.5 text-xs"
            >
              <option>Nov 2026 (Last 30 Days)</option>
              <option>Q3 FY26–27 (Last 90 Days)</option>
              <option>Project Inception to Date</option>
            </select>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-4">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-semibold text-[#172B4D]">{selectedReport}</h3>
              <p className="text-xs text-[#64748B]">
                Reporting Window: {periodLabel} · Scope:{" "}
                {projectFilter === "ALL"
                  ? "All 5 Assigned Projects"
                  : scopedProjects[0]?.name}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs tabular-nums">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F5F7FA] text-[11px] font-semibold uppercase text-[#64748B]">
                    {headers.map((h) => (
                      <th key={h} className="py-2.5 px-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {previewRows.map((row, idx) => (
                    <tr key={idx}>
                      {headers.map((h) => (
                        <td key={h} className="py-2.5 px-3 text-[#172B4D]">
                          {String((row as Record<string, unknown>)[h] ?? "Unavailable")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
