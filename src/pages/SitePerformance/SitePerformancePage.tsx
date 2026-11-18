import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ExternalLink } from "lucide-react";
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
import { formatDate } from "../../lib/utils";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatusIndicator } from "../../components/shared/StatusIndicator";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { ProjectSite } from "../../types/projectManager";

export function SitePerformancePage() {
  const navigate = useNavigate();
  const { projects, sites, selectedProjectId } = usePMStore();
  const [projectFilter, setProjectFilter] = useState(
    selectedProjectId === "ALL" ? "ALL" : selectedProjectId
  );
  const [activeSite, setActiveSite] = useState<ProjectSite | null>(null);

  const filteredSites = useMemo(
    () =>
      projectFilter === "ALL"
        ? sites
        : sites.filter((s) => s.projectId === projectFilter),
    [sites, projectFilter]
  );

  const chartData = filteredSites.map((s) => ({
    code: s.code,
    Planned: s.plannedProgress,
    Actual: s.actualProgress,
    Attendance: s.assignedWorkforce
      ? Math.round((s.presentToday / s.assignedWorkforce) * 100)
      : 0,
  }));

  const getProjectName = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.name ?? "Assigned Project";

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Overview", to: "/" }, { label: "Site Performance" }]}
        title="Cross-Site Performance Monitoring"
        subtitle="Compare execution progress, attendance turnout, material/equipment readiness, and DPR compliance across all active sites."
        meta="Site Managers handle daily execution; Project Manager reviews and coordinates across sites · Sample Data"
        actions={
          <select
            aria-label="Filter sites by project"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs font-medium text-[#172B4D]"
          >
            <option value="ALL">All Assigned Projects ({sites.length} sites)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.name}
              </option>
            ))}
          </select>
        }
      />

      {/* Visual Performance Chart */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-[#172B4D]">
          Site Progress & Attendance Comparison (%)
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="code" tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748B" }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Planned" fill="#94A3B8" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Actual" fill="#2563EB" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Attendance" fill="#16A34A" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Site Comparison Table */}
      <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F5F7FA] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              <th className="py-3 px-4">Site & Project</th>
              <th className="py-3 px-3">Site Leadership</th>
              <th className="py-3 px-3">Attendance</th>
              <th className="py-3 px-3">Planned vs Actual</th>
              <th className="py-3 px-3">Materials / Equipment</th>
              <th className="py-3 px-3">Safety / Issues</th>
              <th className="py-3 px-3">Last DPR</th>
              <th className="py-3 px-4 text-right">Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {filteredSites.map((s) => {
              const attPct = s.assignedWorkforce
                ? Math.round((s.presentToday / s.assignedWorkforce) * 100)
                : 0;
              return (
                <tr
                  key={s.id}
                  onClick={() => setActiveSite(s)}
                  className="hover:bg-slate-50 cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <p className="font-semibold text-[#172B4D]">
                      {s.code} · {s.name}
                    </p>
                    <p className="text-[#64748B]">{getProjectName(s.projectId)}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="text-[#172B4D]">SM: {s.siteManager}</p>
                    <p className="text-[#64748B]">
                      SE: {s.siteEngineer} · Sup: {s.supervisor}
                    </p>
                  </td>
                  <td className="py-3 px-3 tabular-nums">
                    <p className="font-semibold text-[#172B4D]">{attPct}%</p>
                    <p className="text-[#64748B]">
                      {s.presentToday}/{s.assignedWorkforce} present
                    </p>
                  </td>
                  <td className="py-3 px-3 tabular-nums">
                    <p className="font-semibold text-[#172B4D]">
                      {s.actualProgress}% / {s.plannedProgress}%
                    </p>
                    <p className="text-[#64748B]">
                      Var: {s.actualProgress - s.plannedProgress}%
                    </p>
                  </td>
                  <td className="py-3 px-3 space-y-1">
                    <div>
                      <StatusIndicator label={s.materialStatus} />
                    </div>
                    <div>
                      <StatusIndicator label={s.equipmentStatus} />
                    </div>
                  </td>
                  <td className="py-3 px-3 tabular-nums">
                    <p className={s.safetyIncidents30d > 0 ? "text-[#DC2626] font-semibold" : ""}>
                      {s.safetyIncidents30d} safety incidents
                    </p>
                    <p className="text-[#64748B]">{s.openIssuesCount} open issues</p>
                  </td>
                  <td className="py-3 px-3 tabular-nums">
                    <p>{formatDate(s.lastDailyReportDate)}</p>
                    <p className="text-[#64748B]">{s.lastDailyReportStatus}</p>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <StatusIndicator label={s.health} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detailed Site Report Dialog */}
      <Dialog open={Boolean(activeSite)} onOpenChange={(o) => !o && setActiveSite(null)}>
        <DialogContent className="max-w-lg">
          {activeSite && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#2563EB]" />
                  {activeSite.code} — {activeSite.name}
                </DialogTitle>
                <DialogDescription>
                  {getProjectName(activeSite.projectId)} · {activeSite.location}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-3 rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] p-3">
                  <div>
                    <span className="text-[#64748B]">Site Manager</span>
                    <p className="font-semibold text-[#172B4D]">{activeSite.siteManager}</p>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Site Engineer</span>
                    <p className="font-semibold text-[#172B4D]">{activeSite.siteEngineer}</p>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Supervisor</span>
                    <p className="font-semibold text-[#172B4D]">{activeSite.supervisor}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 tabular-nums">
                  <div className="rounded-lg border border-[#E2E8F0] p-3">
                    <span className="text-[#64748B]">Progress (Actual vs Plan)</span>
                    <p className="mt-1 text-base font-semibold text-[#172B4D]">
                      {activeSite.actualProgress}% vs {activeSite.plannedProgress}%
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#E2E8F0] p-3">
                    <span className="text-[#64748B]">Workforce Turnout</span>
                    <p className="mt-1 text-base font-semibold text-[#16A34A]">
                      {activeSite.presentToday} present / {activeSite.requiredWorkforce} req
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <StatusIndicator label={activeSite.health} />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const pid = activeSite.projectId;
                        setActiveSite(null);
                        navigate(`/projects/${pid}`);
                      }}
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open Project
                    </Button>
                    <Button
                      onClick={() => {
                        setActiveSite(null);
                        navigate("/daily-reports");
                      }}
                    >
                      Review Site DPRs
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
