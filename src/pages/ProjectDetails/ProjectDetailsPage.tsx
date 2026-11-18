import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  ClipboardList,
  FileText,
  GitCompareArrows,
  MapPin,
  PackageCheck,
  ShieldAlert,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
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
import { cn, formatDate, formatINR, formatRelativeTime } from "../../lib/utils";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatusIndicator } from "../../components/shared/StatusIndicator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { ProjectSite } from "../../types/projectManager";

export function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    profile,
    projects,
    sites,
    milestones,
    tasks,
    workforce,
    budgetBreakdowns,
    materialRequests,
    equipment,
    issues,
    documents,
    dailyReports,
    activityLogs,
  } = usePMStore();

  const [selectedSite, setSelectedSite] = useState<ProjectSite | null>(null);

  const project = useMemo(() => {
    if (!projectId || !profile.assignedProjectIds.includes(projectId)) {
      return undefined;
    }
    return projects.find((p) => p.id === projectId);
  }, [projectId, profile.assignedProjectIds, projects]);

  const projectSites = useMemo(
    () => sites.filter((s) => s.projectId === projectId),
    [sites, projectId]
  );
  const projectMilestones = useMemo(
    () => milestones.filter((m) => m.projectId === projectId),
    [milestones, projectId]
  );
  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === projectId),
    [tasks, projectId]
  );
  const projectWorkforce = useMemo(
    () => workforce.filter((w) => w.projectId === projectId),
    [workforce, projectId]
  );
  const projectBudgets = useMemo(
    () => budgetBreakdowns.filter((b) => b.projectId === projectId),
    [budgetBreakdowns, projectId]
  );
  const projectMaterials = useMemo(
    () => materialRequests.filter((m) => m.projectId === projectId),
    [materialRequests, projectId]
  );
  const projectEquipment = useMemo(
    () => equipment.filter((e) => e.projectId === projectId),
    [equipment, projectId]
  );
  const projectIssues = useMemo(
    () => issues.filter((i) => i.projectId === projectId),
    [issues, projectId]
  );
  const projectDocuments = useMemo(
    () => documents.filter((d) => d.projectId === projectId),
    [documents, projectId]
  );
  const projectDprs = useMemo(
    () => dailyReports.filter((r) => r.projectId === projectId),
    [dailyReports, projectId]
  );
  const projectActivities = useMemo(
    () => activityLogs.filter((a) => a.projectId === projectId),
    [activityLogs, projectId]
  );

  if (!project) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-[#DC2626]" />
        <h2 className="mt-3 text-lg font-semibold text-[#172B4D]">
          Project Not Accessible or Not Assigned
        </h2>
        <p className="mt-1 text-sm text-[#64748B]">
          Role Rule: Project Managers can only inspect projects explicitly assigned by Company Admin.
        </p>
        <Button className="mt-4" onClick={() => navigate("/projects")}>
          Return to My Projects
        </Button>
      </div>
    );
  }

  const remainingBudget = Math.max(
    0,
    project.revisedBudgetInr - project.approvedExpenditureInr
  );

  const siteComparisonChart = projectSites.map((s) => ({
    name: s.code,
    Planned: s.plannedProgress,
    Actual: s.actualProgress,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Overview", to: "/" },
          { label: "My Projects", to: "/projects" },
          { label: project.code },
        ]}
        title={project.name}
        subtitle={`${project.clientName} · ${project.location} · ${project.type}`}
        meta={`${project.code} · Baseline: ${formatDate(project.startDate)} to ${formatDate(
          project.expectedCompletionDate
        )}${
          project.revisedCompletionDate
            ? ` (Revised: ${formatDate(project.revisedCompletionDate)})`
            : ""
        } · Sample Data`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusIndicator label={project.status} />
            <StatusIndicator label={project.health} />
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/comparison")}
            >
              <GitCompareArrows className="h-4 w-4" />
              <span>Compare</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/projects")}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>All Projects</span>
            </Button>
          </div>
        }
      />

      {/* Top Project Summary Banner */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <img
            src={project.thumbnailUrl}
            alt={project.name}
            referrerPolicy="no-referrer"
            className="h-44 w-full rounded-lg object-cover border border-[#E2E8F0]"
          />
        </div>
        <div className="lg:col-span-8 flex flex-col justify-between gap-4">
          <p className="text-sm text-[#64748B]">{project.description}</p>
          <div className="grid grid-cols-2 gap-4 border-t border-[#E2E8F0] pt-4 sm:grid-cols-4 text-xs tabular-nums">
            <div>
              <span className="text-[#64748B]">Overall Progress</span>
              <p className="mt-0.5 text-lg font-semibold text-[#172B4D]">
                {project.actualProgress}%{" "}
                <span className="text-xs font-normal text-[#64748B]">
                  (Plan {project.plannedProgress}%)
                </span>
              </p>
            </div>
            <div>
              <span className="text-[#64748B]">Approved Budget</span>
              <p className="mt-0.5 text-lg font-semibold text-[#172B4D]">
                {formatINR(project.approvedBudgetInr, true)}
              </p>
              <p className="text-[11px] text-[#64748B]">
                Remaining {formatINR(remainingBudget, true)}
              </p>
            </div>
            <div>
              <span className="text-[#64748B]">Assigned Workforce</span>
              <p className="mt-0.5 text-lg font-semibold text-[#172B4D]">
                {project.presentToday} / {project.assignedWorkforce}
              </p>
              <p className="text-[11px] text-[#64748B]">
                {projectSites.length} active sites
              </p>
            </div>
            <div>
              <span className="text-[#64748B]">Open Issues / Pending MS</span>
              <p className="mt-0.5 text-lg font-semibold text-[#172B4D]">
                {projectIssues.filter((i) => i.status !== "Closed").length} issues
              </p>
              <p className="text-[11px] text-[#64748B]">
                {projectMilestones.filter((m) => m.status !== "Completed").length} pending milestones
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 12-Tab Project Workspace */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">1. Overview</TabsTrigger>
          <TabsTrigger value="sites">2. Sites ({projectSites.length})</TabsTrigger>
          <TabsTrigger value="progress">3. Progress</TabsTrigger>
          <TabsTrigger value="timeline">4. Timeline</TabsTrigger>
          <TabsTrigger value="workforce">5. Workforce</TabsTrigger>
          <TabsTrigger value="budget">6. Budget</TabsTrigger>
          <TabsTrigger value="materials">7. Materials</TabsTrigger>
          <TabsTrigger value="equipment">8. Equipment</TabsTrigger>
          <TabsTrigger value="issues">9. Issues ({projectIssues.length})</TabsTrigger>
          <TabsTrigger value="documents">10. Documents</TabsTrigger>
          <TabsTrigger value="reports">11. Reports</TabsTrigger>
          <TabsTrigger value="activity">12. Activity History</TabsTrigger>
        </TabsList>

        {/* TAB 1: PROJECT OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[#172B4D]">
                Health Diagnostics & Critical Alerts
              </h3>
              <div className="divide-y divide-[#E2E8F0]">
                {project.healthFactors.map((hf) => (
                  <div key={hf.indicator} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#172B4D]">
                        {hf.indicator} ·{" "}
                        <span className="font-mono text-[#64748B]">{hf.value}</span>
                      </span>
                      <StatusIndicator label={hf.status} />
                    </div>
                    <p className="mt-1 text-xs text-[#64748B]">{hf.explanation}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Rule threshold: {hf.threshold}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[#172B4D]">
                Visual Milestone Progress Timeline
              </h3>
              <div className="space-y-3">
                {projectMilestones.length === 0 ? (
                  <p className="text-xs text-[#64748B]">
                    No milestones logged yet for this project.
                  </p>
                ) : (
                  projectMilestones.map((ms) => (
                    <div
                      key={ms.id}
                      className="rounded-lg border border-[#E2E8F0] p-3 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#172B4D]">
                          {ms.name}
                        </span>
                        <StatusIndicator label={ms.status} />
                      </div>
                      <p className="mt-1 text-[#64748B]">
                        {ms.siteName} · Planned {formatDate(ms.originalPlannedDate)}
                        {ms.revisedDate ? ` -> Revised ${formatDate(ms.revisedDate)}` : ""}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#2563EB]"
                            style={{ width: `${ms.completionPercent}%` }}
                          />
                        </div>
                        <span className="font-mono font-semibold tabular-nums">
                          {ms.completionPercent}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: SITES */}
        <TabsContent value="sites" className="space-y-6">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-[#172B4D]">
              Intra-Project Site Progress Comparison
            </h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={siteComparisonChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748B" }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Planned" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Actual" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {projectSites.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedSite(s)}
                className="rounded-xl border border-[#E2E8F0] bg-white p-4 hover:border-[#2563EB] transition-colors cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-mono text-[#64748B]">
                      {s.code} · {s.location}
                    </p>
                    <h4 className="font-semibold text-[#172B4D]">{s.name}</h4>
                  </div>
                  <StatusIndicator label={s.health} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-[#64748B]">
                  <span>Site Manager: {s.siteManager}</span>
                  <span>Site Engineer: {s.siteEngineer}</span>
                  <span>Supervisor: {s.supervisor}</span>
                  <span className="tabular-nums">
                    Workforce: {s.presentToday}/{s.assignedWorkforce} present
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E2E8F0] pt-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <StatusIndicator label={s.materialStatus} />
                    <StatusIndicator label={s.equipmentStatus} />
                  </div>
                  <span className="text-[#64748B] tabular-nums">
                    Last DPR: {formatDate(s.lastDailyReportDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: PROGRESS */}
        <TabsContent value="progress">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[#172B4D]">
              Task & Work-Package Progress Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase">
                    <th className="py-2.5 pr-4">Task</th>
                    <th className="py-2.5 px-3">Site</th>
                    <th className="py-2.5 px-3">Owner</th>
                    <th className="py-2.5 px-3">Duration (Plan vs Act)</th>
                    <th className="py-2.5 px-3">Progress</th>
                    <th className="py-2.5 pl-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {projectTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-[#64748B]">
                        All tasks for this project are closed or archived.
                      </td>
                    </tr>
                  ) : (
                    projectTasks.map((t) => (
                      <tr key={t.id}>
                        <td className="py-3 pr-4 font-medium text-[#172B4D]">{t.name}</td>
                        <td className="py-3 px-3 text-[#64748B]">{t.siteName}</td>
                        <td className="py-3 px-3 text-[#172B4D]">{t.responsiblePerson}</td>
                        <td className="py-3 px-3 tabular-nums text-[#64748B]">
                          {t.plannedDurationDays}d plan / {t.actualDurationDays}d actual
                        </td>
                        <td className="py-3 px-3 tabular-nums font-semibold">
                          {t.progress}%
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <StatusIndicator label={t.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 4: TIMELINE */}
        <TabsContent value="timeline">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#172B4D]">
                Schedule Baseline vs Revised Milestones
              </h3>
              <Button size="sm" variant="outline" onClick={() => navigate("/timeline")}>
                Open Full Gantt Workspace
              </Button>
            </div>
            <div className="space-y-3">
              {projectMilestones.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg border border-[#E2E8F0] p-3.5 text-xs space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-[#64748B]">{m.phase}</span>
                      <p className="text-sm font-semibold text-[#172B4D]">{m.name}</p>
                    </div>
                    <StatusIndicator label={m.status} />
                  </div>
                  <div className="flex flex-wrap gap-4 text-[#64748B] tabular-nums">
                    <span>Original Planned: {formatDate(m.originalPlannedDate)}</span>
                    {m.revisedDate && (
                      <span className="text-[#B45309] font-medium">
                        Revised Target: {formatDate(m.revisedDate)}
                      </span>
                    )}
                    {m.actualCompletionDate && (
                      <span className="text-[#16A34A] font-medium">
                        Completed: {formatDate(m.actualCompletionDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* TAB 5: WORKFORCE */}
        <TabsContent value="workforce">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#172B4D]">
                  Assigned Workforce Roster (Sample Crew Records)
                </h3>
                <p className="text-xs text-[#64748B]">
                  Employee salary & payroll data excluded per Project Manager RBAC policy.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate("/workforce")}>
                <Users className="h-3.5 w-3.5" /> Full Workforce Module
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase">
                    <th className="py-2.5 pr-4">Worker / Staff</th>
                    <th className="py-2.5 px-3">Designation</th>
                    <th className="py-2.5 px-3">Site</th>
                    <th className="py-2.5 px-3">Supervisor</th>
                    <th className="py-2.5 pl-3 text-right">Attendance Today</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {projectWorkforce.map((w) => (
                    <tr key={w.id}>
                      <td className="py-2.5 pr-4">
                        <p className="font-semibold text-[#172B4D]">{w.name}</p>
                        <p className="font-mono text-[#64748B]">
                          {w.employeeId} · {w.employmentType}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 text-[#172B4D]">{w.designation}</td>
                      <td className="py-2.5 px-3 text-[#64748B]">{w.siteName}</td>
                      <td className="py-2.5 px-3 text-[#64748B]">{w.reportingSupervisor}</td>
                      <td className="py-2.5 pl-3 text-right">
                        <StatusIndicator label={w.attendanceStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 6: BUDGET */}
        <TabsContent value="budget">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[#172B4D]">
                  Cost Control Breakdown (Strict Financial Separation)
                </h3>
                <p className="text-xs text-[#64748B]">
                  Committed POs, Approved Expenses, and Paid Settlements are tracked in separate columns.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate("/budget")}>
                <Wallet className="h-3.5 w-3.5" /> Budget & Cost Control
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs tabular-nums">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase">
                    <th className="py-2.5 pr-4">Category</th>
                    <th className="py-2.5 px-3 text-right">Approved Budget</th>
                    <th className="py-2.5 px-3 text-right">Committed Cost</th>
                    <th className="py-2.5 px-3 text-right">Approved Expense</th>
                    <th className="py-2.5 pl-3 text-right">Paid Expense</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {projectBudgets.map((b) => (
                    <tr key={b.category}>
                      <td className="py-2.5 pr-4 font-medium text-[#172B4D]">{b.category}</td>
                      <td className="py-2.5 px-3 text-right">{formatINR(b.approvedInr, true)}</td>
                      <td className="py-2.5 px-3 text-right text-[#7C3AED]">
                        {formatINR(b.committedInr, true)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#2563EB]">
                        {formatINR(b.approvedExpenseInr, true)}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-semibold text-[#16A34A]">
                        {formatINR(b.paidInr, true)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 7: MATERIALS */}
        <TabsContent value="materials">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#172B4D]">
                Project Material Requests & Delivery Verification
              </h3>
              <Button size="sm" variant="outline" onClick={() => navigate("/materials")}>
                <PackageCheck className="h-3.5 w-3.5" /> Procurement Module
              </Button>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {projectMaterials.length === 0 ? (
                <p className="py-4 text-xs text-[#64748B]">No pending material requisitions.</p>
              ) : (
                projectMaterials.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-[#172B4D]">
                        {m.requestNumber} · {m.materialName} ({m.quantity} {m.unit})
                      </p>
                      <p className="text-[#64748B]">
                        {m.siteName} · Est. {formatINR(m.estimatedCostInr)} · Site Stock:{" "}
                        {m.currentSiteStock} {m.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIndicator label={m.approvalStatus} />
                      <StatusIndicator label={m.deliveryStatus} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 8: EQUIPMENT */}
        <TabsContent value="equipment">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#172B4D]">
                Assigned Machinery & Equipment Utilization
              </h3>
              <Button size="sm" variant="outline" onClick={() => navigate("/equipment")}>
                <Truck className="h-3.5 w-3.5" /> Equipment Module
              </Button>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {projectEquipment.map((eq) => (
                <div
                  key={eq.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
                >
                  <div>
                    <p className="font-semibold text-[#172B4D]">
                      {eq.equipmentCode} · {eq.name}
                    </p>
                    <p className="text-[#64748B]">
                      {eq.siteName} · Operator: {eq.operatorName} · Utilization:{" "}
                      <span className="tabular-nums font-medium">{eq.utilizationPercent}%</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIndicator label={eq.availability} />
                    <StatusIndicator label={eq.maintenanceStatus} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* TAB 9: ISSUES */}
        <TabsContent value="issues">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#172B4D]">
                Project Issues & Escalations
              </h3>
              <Button size="sm" variant="outline" onClick={() => navigate("/issues")}>
                <AlertTriangle className="h-3.5 w-3.5" /> Manage Issues & Risks
              </Button>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {projectIssues.length === 0 ? (
                <p className="py-4 text-xs text-[#64748B]">Zero open issues on this project.</p>
              ) : (
                projectIssues.map((iss) => (
                  <div
                    key={iss.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-[#172B4D]">
                        {iss.issueCode} · {iss.title}
                      </p>
                      <p className="text-[#64748B]">
                        {iss.siteName} · Assigned: {iss.assignedTo} · Due {formatDate(iss.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIndicator label={iss.priority} />
                      <StatusIndicator label={iss.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 10: DOCUMENTS */}
        <TabsContent value="documents">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#172B4D]">
                Project Drawings, BOQ & Contracts
              </h3>
              <Button size="sm" variant="outline" onClick={() => navigate("/documents")}>
                <FileText className="h-3.5 w-3.5" /> Document Repository
              </Button>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {projectDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
                >
                  <div>
                    <p className="font-semibold text-[#172B4D]">{doc.title}</p>
                    <p className="text-[#64748B] font-mono">
                      {doc.fileName} · {doc.version} · {doc.fileSize} · {doc.accessScope}
                    </p>
                  </div>
                  <span className="text-[#64748B]">
                    Uploaded {formatDate(doc.uploadedDate)} by {doc.uploadedBy}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* TAB 11: REPORTS */}
        <TabsContent value="reports">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#172B4D]">
                Daily Progress Reports (DPRs)
              </h3>
              <Button size="sm" variant="outline" onClick={() => navigate("/daily-reports")}>
                <ClipboardList className="h-3.5 w-3.5" /> Open DPR Review Queue
              </Button>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {projectDprs.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
                >
                  <div>
                    <p className="font-semibold text-[#172B4D]">
                      {r.reportCode} · {r.siteName}
                    </p>
                    <p className="text-[#64748B]">{r.workCompleted}</p>
                  </div>
                  <StatusIndicator label={r.reviewStatus} />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* TAB 12: ACTIVITY HISTORY */}
        <TabsContent value="activity">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#172B4D]">
              Project Audit & Activity History
            </h3>
            <div className="divide-y divide-[#E2E8F0]">
              {projectActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-xs"
                >
                  <div>
                    <p className="text-[#172B4D]">
                      <span className="font-semibold">{act.user}</span> — {act.action}
                    </p>
                    <p className="text-[#64748B]">{act.siteName}</p>
                  </div>
                  <span className="text-[#64748B] tabular-nums">
                    {formatRelativeTime(act.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Site Detail Performance Drawer Modal */}
      <Dialog
        open={Boolean(selectedSite)}
        onOpenChange={(open) => !open && setSelectedSite(null)}
      >
        <DialogContent className="max-w-lg">
          {selectedSite && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedSite.code} — {selectedSite.name}
                </DialogTitle>
                <DialogDescription>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {selectedSite.location}
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] p-3">
                  <div>
                    <span className="text-[#64748B]">Site Manager</span>
                    <p className="font-semibold text-[#172B4D]">{selectedSite.siteManager}</p>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Site Engineer</span>
                    <p className="font-semibold text-[#172B4D]">{selectedSite.siteEngineer}</p>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Supervisor</span>
                    <p className="font-semibold text-[#172B4D]">{selectedSite.supervisor}</p>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Last DPR</span>
                    <p className="font-semibold text-[#172B4D]">
                      {formatDate(selectedSite.lastDailyReportDate)} ({selectedSite.lastDailyReportStatus})
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center tabular-nums">
                  <div className="rounded-lg border border-[#E2E8F0] p-3">
                    <span className="text-[#64748B]">Progress</span>
                    <p className="mt-1 text-base font-semibold text-[#172B4D]">
                      {selectedSite.actualProgress}% / {selectedSite.plannedProgress}%
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#E2E8F0] p-3">
                    <span className="text-[#64748B]">Attendance</span>
                    <p className="mt-1 text-base font-semibold text-[#16A34A]">
                      {selectedSite.presentToday}/{selectedSite.assignedWorkforce}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#E2E8F0] p-3">
                    <span className="text-[#64748B]">Open Issues</span>
                    <p className="mt-1 text-base font-semibold text-[#DC2626]">
                      {selectedSite.openIssuesCount}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedSite(null)}>
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedSite(null);
                      navigate("/sites");
                    }}
                  >
                    <Building2 className="h-4 w-4" /> Open All Sites Comparison
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
