import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Flag, GitCommitHorizontal } from "lucide-react";
import { usePMStore } from "../../store/pmStore";
import { cn, formatDate } from "../../lib/utils";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatusIndicator } from "../../components/shared/StatusIndicator";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/shared/EmptyState";

export function ProjectTimelinePage() {
  const navigate = useNavigate();
  const { projects, sites, tasks, milestones, selectedProjectId } = usePMStore();

  const [projectFilter, setProjectFilter] = useState(
    selectedProjectId === "ALL" ? "ALL" : selectedProjectId
  );
  const [siteFilter, setSiteFilter] = useState("ALL");
  const [phaseFilter, setPhaseFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const phases = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.phase))),
    [tasks]
  );

  const availableSites = useMemo(
    () =>
      projectFilter === "ALL"
        ? sites
        : sites.filter((s) => s.projectId === projectFilter),
    [sites, projectFilter]
  );

  const filteredTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (projectFilter !== "ALL" && t.projectId !== projectFilter) return false;
        if (siteFilter !== "ALL" && t.siteId !== siteFilter) return false;
        if (phaseFilter !== "ALL" && t.phase !== phaseFilter) return false;
        if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
        return true;
      }),
    [tasks, projectFilter, siteFilter, phaseFilter, statusFilter]
  );

  const filteredMilestones = useMemo(
    () =>
      milestones.filter((m) => {
        if (projectFilter !== "ALL" && m.projectId !== projectFilter) return false;
        if (siteFilter !== "ALL" && m.siteId !== siteFilter) return false;
        return true;
      }),
    [milestones, projectFilter, siteFilter]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Overview", to: "/" }, { label: "Project Timeline" }]}
        title="Project Gantt Timeline & Dependencies"
        subtitle="Track phase windows, planned versus actual duration bars, delayed activities, and milestone markers."
        meta="Timeline spans Nov 2026 active work packages · Original planned dates preserved · Sample Data"
        actions={
          <Button variant="outline" onClick={() => navigate("/milestones")}>
            Manage Milestones & Tasks
          </Button>
        }
      />

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <select
          aria-label="Filter timeline by project"
          value={projectFilter}
          onChange={(e) => {
            setProjectFilter(e.target.value);
            setSiteFilter("ALL");
          }}
          className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#172B4D]"
        >
          <option value="ALL">Project: All Assigned</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} · {p.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter timeline by site"
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value)}
          className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#172B4D]"
        >
          <option value="ALL">Site: All Sites</option>
          {availableSites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} · {s.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter timeline by phase"
          value={phaseFilter}
          onChange={(e) => setPhaseFilter(e.target.value)}
          className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#172B4D]"
        >
          <option value="ALL">Phase: All Phases</option>
          {phases.map((ph) => (
            <option key={ph} value={ph}>
              {ph}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter timeline by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#172B4D]"
        >
          <option value="ALL">Status: All</option>
          <option value="In Progress">In Progress</option>
          <option value="Delayed">Delayed</option>
          <option value="Blocked">Blocked</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Gantt Schedule Grid */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          title="No timeline activities match the selected filters"
          description="Try broadening the project, phase, or status filter."
          actionLabel="Clear Filters"
          onAction={() => {
            setProjectFilter("ALL");
            setSiteFilter("ALL");
            setPhaseFilter("ALL");
            setStatusFilter("ALL");
          }}
        />
      ) : (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3 text-xs">
            <h2 className="font-semibold text-[#172B4D]">
              Active Work-Package Schedule Bars (Nov 2026 Window)
            </h2>
            <div className="flex items-center gap-4 text-[#64748B]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-4 rounded-xs bg-slate-300" /> Planned Window
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-4 rounded-xs bg-[#2563EB]" /> On-Track Execution
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-4 rounded-xs bg-[#DC2626]" /> Delayed / Blocked
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {filteredTasks.map((t, index) => {
              const isSlip = t.status === "Delayed" || t.status === "Blocked";
              const leftOffsetPct = Math.min(45, (index * 11) % 40);
              const plannedWidthPct = Math.min(50, Math.max(22, t.plannedDurationDays * 4));
              const actualWidthPct = Math.min(
                60,
                Math.max(18, t.actualDurationDays * 4)
              );

              return (
                <div
                  key={t.id}
                  className="grid grid-cols-1 gap-3 rounded-lg border border-[#E2E8F0] p-3.5 lg:grid-cols-12 lg:items-center"
                >
                  <div className="lg:col-span-5 space-y-1">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#64748B]">
                      <span>{t.phase}</span>
                      <span>·</span>
                      <span>{t.projectName}</span>
                    </div>
                    <p className="text-sm font-semibold text-[#172B4D]">{t.name}</p>
                    <p className="text-xs text-[#64748B]">
                      {t.siteName} · Lead: {t.responsiblePerson}
                    </p>
                    {t.dependencies.length > 0 && (
                      <p className="inline-flex items-center gap-1 text-[11px] text-[#7C3AED]">
                        <GitCommitHorizontal className="h-3 w-3" />
                        Depends on: {t.dependencies.join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Gantt Track */}
                  <div className="lg:col-span-5 space-y-1.5">
                    <div className="relative h-7 w-full rounded-md bg-slate-100 p-1">
                      {/* Planned bar */}
                      <div
                        className="absolute top-1 h-2 rounded-xs bg-slate-400/70"
                        style={{
                          left: `${leftOffsetPct}%`,
                          width: `${plannedWidthPct}%`,
                        }}
                        title={`Planned: ${formatDate(t.plannedStart)} to ${formatDate(t.plannedEnd)}`}
                      />
                      {/* Actual bar */}
                      <div
                        className={cn(
                          "absolute bottom-1 h-2.5 rounded-xs transition-all",
                          isSlip
                            ? "bg-[#DC2626]"
                            : t.status === "Completed"
                              ? "bg-[#16A34A]"
                              : "bg-[#2563EB]"
                        )}
                        style={{
                          left: `${leftOffsetPct}%`,
                          width: `${actualWidthPct}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#64748B] tabular-nums">
                      <span>
                        Plan: {formatDate(t.plannedStart)} → {formatDate(t.plannedEnd)}
                      </span>
                      <span>
                        {t.actualDurationDays}d / {t.plannedDurationDays}d
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-2 flex items-center justify-between lg:flex-col lg:items-end gap-1.5">
                    <StatusIndicator label={t.status} />
                    <span className="text-xs font-mono font-semibold text-[#172B4D] tabular-nums">
                      {t.progress}% complete
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Milestone Markers Strip */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-[#F59E0B]" />
          <h2 className="text-sm font-semibold text-[#172B4D]">
            Milestone Checkpoints & Baseline Variance
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredMilestones.map((m) => (
            <div
              key={m.id}
              className="rounded-lg border border-[#E2E8F0] p-3 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[#172B4D] truncate">{m.name}</span>
                <StatusIndicator label={m.status} />
              </div>
              <p className="text-[#64748B]">{m.projectName}</p>
              <p className="tabular-nums text-[#64748B]">
                Baseline: {formatDate(m.originalPlannedDate)}
                {m.revisedDate ? (
                  <span className="text-[#DC2626] font-medium">
                    {" "}
                    · Revised: {formatDate(m.revisedDate)}
                  </span>
                ) : null}
              </p>
              {m.status === "Blocked" && (
                <p className="inline-flex items-center gap-1 text-[#DC2626]">
                  <AlertCircle className="h-3.5 w-3.5" /> {m.dependencies[0]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
