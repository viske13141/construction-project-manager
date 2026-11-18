import { useMemo, useState } from "react";
import { ShieldCheck, UserPlus, Users } from "lucide-react";
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
import { PageHeader } from "../../components/shared/PageHeader";
import { StatusIndicator } from "../../components/shared/StatusIndicator";
import { Button } from "../../components/ui/button";
import { ConfirmActionDialog } from "../../components/shared/ConfirmActionDialog";
import { WorkforceShortageAlert } from "../../types/projectManager";
import { toast } from "sonner";

export function ProjectWorkforcePage() {
  const {
    projects,
    sites,
    workforce,
    shortageAlerts,
    selectedProjectId,
    submitManpowerRequest,
  } = usePMStore();

  const [projectFilter, setProjectFilter] = useState(
    selectedProjectId === "ALL" ? "ALL" : selectedProjectId
  );
  const [siteFilter, setSiteFilter] = useState("ALL");
  const [designationFilter, setDesignationFilter] = useState("ALL");
  const [attendanceFilter, setAttendanceFilter] = useState("ALL");
  const [requestTarget, setRequestTarget] = useState<WorkforceShortageAlert | null>(null);

  const scopedProjects = useMemo(
    () =>
      projectFilter === "ALL"
        ? projects
        : projects.filter((p) => p.id === projectFilter),
    [projects, projectFilter]
  );

  const scopedSites = useMemo(
    () =>
      projectFilter === "ALL"
        ? sites
        : sites.filter((s) => s.projectId === projectFilter),
    [sites, projectFilter]
  );

  const summary = useMemo(() => {
    const required = scopedSites.reduce((acc, s) => acc + s.requiredWorkforce, 0);
    const assigned = scopedSites.reduce((acc, s) => acc + s.assignedWorkforce, 0);
    const present = scopedSites.reduce((acc, s) => acc + s.presentToday, 0);
    const absent = scopedSites.reduce((acc, s) => acc + s.absentToday, 0);
    const onLeave = scopedSites.reduce((acc, s) => acc + s.onLeaveToday, 0);
    const contractors = scopedProjects.reduce((acc, p) => acc + p.activeContractors, 0);
    return {
      required,
      assigned,
      present,
      absent,
      onLeave,
      contractors,
      shortage: Math.max(0, required - assigned),
    };
  }, [scopedSites, scopedProjects]);

  const filteredRoster = useMemo(
    () =>
      workforce.filter((w) => {
        if (projectFilter !== "ALL" && w.projectId !== projectFilter) return false;
        if (siteFilter !== "ALL" && w.siteId !== siteFilter) return false;
        if (designationFilter !== "ALL" && w.designation !== designationFilter)
          return false;
        if (attendanceFilter !== "ALL" && w.attendanceStatus !== attendanceFilter)
          return false;
        return true;
      }),
    [workforce, projectFilter, siteFilter, designationFilter, attendanceFilter]
  );

  const filteredShortages = useMemo(
    () =>
      shortageAlerts.filter(
        (sh) => projectFilter === "ALL" || sh.projectId === projectFilter
      ),
    [shortageAlerts, projectFilter]
  );

  const chartData = scopedSites.map((s) => ({
    site: s.code,
    Required: s.requiredWorkforce,
    Assigned: s.assignedWorkforce,
    Present: s.presentToday,
  }));

  const designations = Array.from(new Set(workforce.map((w) => w.designation)));

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Overview", to: "/" }, { label: "Project Workforce" }]}
        title="Project Workforce & Deployment"
        subtitle="Monitor labour strength, daily site attendance, contractor crews, and manpower shortages across assigned projects."
        meta="Reporting Date: 18 Nov 2026 (IST) · Employee salary & payroll structures restricted by Company Admin · Sample Data"
      />

      {/* Workforce Summary Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 text-xs tabular-nums">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <span className="text-[#64748B]">Assigned Workforce</span>
          <p className="mt-1 text-2xl font-semibold text-[#172B4D]">{summary.assigned}</p>
          <span className="text-[#64748B]">Req: {summary.required}</span>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <span className="text-[#64748B]">Present Today</span>
          <p className="mt-1 text-2xl font-semibold text-[#16A34A]">{summary.present}</p>
          <span className="text-[#64748B]">
            {summary.assigned ? Math.round((summary.present / summary.assigned) * 100) : 0}% turnout
          </span>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <span className="text-[#64748B]">Absent Today</span>
          <p className="mt-1 text-2xl font-semibold text-[#DC2626]">{summary.absent}</p>
          <span className="text-[#64748B]">Unplanned absence</span>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <span className="text-[#64748B]">On Leave</span>
          <p className="mt-1 text-2xl font-semibold text-[#B45309]">{summary.onLeave}</p>
          <span className="text-[#64748B]">Approved leave</span>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <span className="text-[#64748B]">Active Contractors</span>
          <p className="mt-1 text-2xl font-semibold text-[#172B4D]">{summary.contractors}</p>
          <span className="text-[#64748B]">Subcontract firms</span>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <span className="text-[#64748B]">Workforce Shortage</span>
          <p className="mt-1 text-2xl font-semibold text-[#DC2626]">{summary.shortage}</p>
          <span className="text-[#64748B]">Below site target</span>
        </div>
      </div>

      {/* Site-wise Chart + Shortage Actions */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7 rounded-xl border border-[#E2E8F0] bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-[#172B4D]">
            Site-Wise Manpower Deployment (Required vs Assigned vs Present)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="site" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Required" fill="#CBD5E1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Assigned" fill="#2563EB" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Present" fill="#16A34A" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-5 rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#172B4D]">
              Critical Designation Shortages
            </h2>
            <Users className="h-4 w-4 text-[#DC2626]" />
          </div>
          <div className="space-y-3">
            {filteredShortages.map((sh) => (
              <div
                key={sh.id}
                className="rounded-lg border border-[#E2E8F0] p-3.5 text-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#172B4D]">{sh.designation}</p>
                    <p className="text-[#64748B]">
                      {sh.projectName} · {sh.siteName}
                    </p>
                  </div>
                  <span className="font-mono font-semibold text-[#DC2626] tabular-nums shrink-0">
                    -{sh.shortageCount} short
                  </span>
                </div>
                <p className="text-[#64748B]">{sh.impactNote}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[#64748B] tabular-nums">
                    Available {sh.availableCount} / {sh.requiredCount} required
                  </span>
                  {sh.requestSubmitted ? (
                    <StatusIndicator label={`Requested (${sh.requestRef})`} tone="info" />
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRequestTarget(sh)}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Request Manpower</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workforce Allocation Roster */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#172B4D]">
              Workforce Allocation Roster (Sample Representative Records)
            </h2>
            <p className="text-xs text-[#64748B]">
              Project Managers view operational assignments; HR master edits and payroll remain restricted.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <select
              aria-label="Filter roster by project"
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setSiteFilter("ALL");
              }}
              className="h-8.5 rounded-lg border border-[#E2E8F0] px-2 text-xs"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter roster by site"
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="h-8.5 rounded-lg border border-[#E2E8F0] px-2 text-xs"
            >
              <option value="ALL">All Sites</option>
              {scopedSites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter roster by designation"
              value={designationFilter}
              onChange={(e) => setDesignationFilter(e.target.value)}
              className="h-8.5 rounded-lg border border-[#E2E8F0] px-2 text-xs"
            >
              <option value="ALL">All Designations</option>
              {designations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter roster by attendance"
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value)}
              className="h-8.5 rounded-lg border border-[#E2E8F0] px-2 text-xs"
            >
              <option value="ALL">All Attendance</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F5F7FA] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="py-2.5 px-3">Employee / Worker</th>
                <th className="py-2.5 px-3">Designation & Dept</th>
                <th className="py-2.5 px-3">Assigned Project & Site</th>
                <th className="py-2.5 px-3">Reporting Supervisor</th>
                <th className="py-2.5 px-3">Assignment</th>
                <th className="py-2.5 px-3 text-right">Attendance (IST)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredRoster.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3">
                    <p className="font-semibold text-[#172B4D]">{w.name}</p>
                    <p className="font-mono text-[#64748B]">
                      {w.employeeId} · {w.employmentType}
                    </p>
                  </td>
                  <td className="py-2.5 px-3">
                    <p className="text-[#172B4D]">{w.designation}</p>
                    <p className="text-[#64748B]">{w.department}</p>
                  </td>
                  <td className="py-2.5 px-3">
                    <p className="text-[#172B4D]">{w.projectName}</p>
                    <p className="text-[#64748B]">{w.siteName}</p>
                  </td>
                  <td className="py-2.5 px-3 text-[#64748B]">{w.reportingSupervisor}</td>
                  <td className="py-2.5 px-3">
                    <StatusIndicator label={w.assignmentStatus} />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <StatusIndicator label={w.attendanceStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#64748B] pt-1">
          <ShieldCheck className="h-4 w-4 text-[#2563EB]" />
          <span>
            Payroll & Wage Privacy: Wage rates, bank details, and PF/ESI deductions are hidden from Project Manager views.
          </span>
        </div>
      </div>

      <ConfirmActionDialog
        open={Boolean(requestTarget)}
        onOpenChange={(o) => !o && setRequestTarget(null)}
        title="Submit Manpower Requisition to HR / Company Admin"
        description={
          requestTarget
            ? `Request ${requestTarget.shortageCount} ${requestTarget.designation} workers for ${requestTarget.siteName}.`
            : ""
        }
        confirmLabel="Submit Requisition"
        reasonLabel="Deployment Schedule & Trade Requirements"
        onConfirm={(note) => {
          if (requestTarget) {
            submitManpowerRequest(requestTarget.id, note);
            toast.success("Manpower allocation request submitted to HR & Company Admin.");
          }
        }}
      />
    </div>
  );
}
