import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { History, Plus, Pencil } from "lucide-react";
import { usePMStore } from "../../store/pmStore";
import { formatDate } from "../../lib/utils";
import { MilestoneStatus, ProjectMilestone, ProjectTask, TaskStatus } from "../../types/projectManager";
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
import { toast } from "sonner";

const createMilestoneSchema = z.object({
  projectId: z.string().min(1, "Select a project"),
  siteId: z.string().min(1, "Select a site"),
  phase: z.string().min(2, "Enter phase"),
  name: z.string().min(4, "Milestone name must be at least 4 characters"),
  description: z.string().min(6, "Provide milestone scope"),
  originalPlannedDate: z.string().min(1, "Original planned date is required"),
  responsiblePerson: z.string().min(2, "Assign responsible person"),
  assignedTeam: z.string().min(2, "Assign team"),
});

type CreateMilestoneForm = z.infer<typeof createMilestoneSchema>;

export function MilestonesTasksPage() {
  const {
    projects,
    sites,
    milestones,
    tasks,
    selectedProjectId,
    addMilestone,
    updateMilestone,
    reassignTask,
  } = usePMStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingMs, setEditingMs] = useState<ProjectMilestone | null>(null);
  const [revisedDateInput, setRevisedDateInput] = useState("");
  const [msPercentInput, setMsPercentInput] = useState(0);
  const [msStatusInput, setMsStatusInput] = useState<MilestoneStatus>(MilestoneStatus.IN_PROGRESS);
  const [msReasonInput, setMsReasonInput] = useState("");
  const [historyMs, setHistoryMs] = useState<ProjectMilestone | null>(null);

  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [taskOwner, setTaskOwner] = useState("");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>(TaskStatus.IN_PROGRESS);
  const [taskProgress, setTaskProgress] = useState(0);

  const scopedMilestones = useMemo(
    () =>
      selectedProjectId === "ALL"
        ? milestones
        : milestones.filter((m) => m.projectId === selectedProjectId),
    [milestones, selectedProjectId]
  );

  const scopedTasks = useMemo(
    () =>
      selectedProjectId === "ALL"
        ? tasks
        : tasks.filter((t) => t.projectId === selectedProjectId),
    [tasks, selectedProjectId]
  );

  const form = useForm<CreateMilestoneForm>({
    resolver: zodResolver(createMilestoneSchema),
    defaultValues: {
      projectId: projects[0]?.id ?? "",
      siteId: sites[0]?.id ?? "",
      phase: "Superstructure",
      name: "",
      description: "",
      originalPlannedDate: "2026-12-15",
      responsiblePerson: "Ramesh Kulkarni",
      assignedTeam: "Core Structural Crew",
    },
  });

  const watchedProjectId = form.watch("projectId");
  const modalSites = useMemo(
    () => sites.filter((s) => s.projectId === watchedProjectId),
    [sites, watchedProjectId]
  );

  const onCreateSubmit = (data: CreateMilestoneForm) => {
    addMilestone(data);
    toast.success(`Baseline milestone "${data.name}" created with original planned date locked.`);
    form.reset();
    setCreateOpen(false);
  };

  const openEditMilestone = (ms: ProjectMilestone) => {
    setEditingMs(ms);
    setRevisedDateInput(ms.revisedDate || ms.originalPlannedDate);
    setMsPercentInput(ms.completionPercent);
    setMsStatusInput(ms.status);
    setMsReasonInput("");
  };

  const saveMilestoneRevision = () => {
    if (!editingMs) return;
    const dateChanged =
      revisedDateInput !== (editingMs.revisedDate || editingMs.originalPlannedDate);
    if (dateChanged && msReasonInput.trim().length < 5) {
      toast.error("Please provide a revision reason when changing target dates.");
      return;
    }
    updateMilestone(editingMs.id, {
      revisedDate: dateChanged ? revisedDateInput : editingMs.revisedDate,
      completionPercent: msPercentInput,
      status: msStatusInput,
      reason: msReasonInput.trim() || "Progress update by Project Manager",
    });
    toast.success("Milestone updated; original baseline date preserved.");
    setEditingMs(null);
  };

  const openTaskEdit = (t: ProjectTask) => {
    setEditingTask(t);
    setTaskOwner(t.responsiblePerson);
    setTaskStatus(t.status);
    setTaskProgress(t.progress);
  };

  const saveTaskUpdate = () => {
    if (!editingTask) return;
    reassignTask(editingTask.id, taskOwner, taskStatus, taskProgress);
    toast.success(`Task "${editingTask.name}" updated within your assigned project scope.`);
    setEditingTask(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Overview", to: "/" }, { label: "Milestones & Tasks" }]}
        title="Milestones & Task Monitoring"
        subtitle="Track baseline deadlines, revisions with preserved original planned dates, and site-level task assignments."
        meta="Business Rule: Original planned dates are never overwritten on revision · Sample Data"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>Create Milestone</span>
          </Button>
        }
      />

      <Tabs defaultValue="milestones">
        <TabsList>
          <TabsTrigger value="milestones">
            Milestones ({scopedMilestones.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">Task Monitoring ({scopedTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="milestones" className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F5F7FA] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  <th className="py-3 px-4">Milestone & Project</th>
                  <th className="py-3 px-3">Original Planned</th>
                  <th className="py-3 px-3">Revised / Actual</th>
                  <th className="py-3 px-3">Responsible</th>
                  <th className="py-3 px-3">Completion</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {scopedMilestones.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#172B4D]">{m.name}</p>
                      <p className="text-[#64748B]">
                        {m.projectName} · {m.siteName}
                      </p>
                    </td>
                    <td className="py-3 px-3 tabular-nums font-medium text-[#172B4D]">
                      {formatDate(m.originalPlannedDate)}
                    </td>
                    <td className="py-3 px-3 tabular-nums">
                      {m.actualCompletionDate ? (
                        <span className="text-[#16A34A] font-semibold">
                          Done {formatDate(m.actualCompletionDate)}
                        </span>
                      ) : m.revisedDate ? (
                        <span className="text-[#B45309] font-semibold">
                          Rev {formatDate(m.revisedDate)}
                        </span>
                      ) : (
                        <span className="text-[#64748B]">On original baseline</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-[#172B4D]">{m.responsiblePerson}</p>
                      <p className="text-[#64748B]">{m.assignedTeam}</p>
                    </td>
                    <td className="py-3 px-3 tabular-nums font-semibold">
                      {m.completionPercent}%
                    </td>
                    <td className="py-3 px-3">
                      <StatusIndicator label={m.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setHistoryMs(m)}
                          title="View revision history"
                        >
                          <History className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditMilestone(m)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>Update</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F5F7FA] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  <th className="py-3 px-4">Task & Site</th>
                  <th className="py-3 px-3">Responsible</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Duration (Plan / Act)</th>
                  <th className="py-3 px-3">Progress</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {scopedTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#172B4D]">{t.name}</p>
                      <p className="text-[#64748B]">
                        {t.projectName} · {t.siteName}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-[#172B4D]">{t.responsiblePerson}</p>
                      <p className="text-[#64748B]">{t.assignedTeam}</p>
                    </td>
                    <td className="py-3 px-3">
                      <StatusIndicator label={t.priority} />
                    </td>
                    <td className="py-3 px-3 tabular-nums text-[#64748B]">
                      {t.plannedDurationDays}d / {t.actualDurationDays}d
                    </td>
                    <td className="py-3 px-3 tabular-nums font-semibold">{t.progress}%</td>
                    <td className="py-3 px-3 tabular-nums text-[#64748B]">
                      {formatDate(t.dueDate)}
                    </td>
                    <td className="py-3 px-3">
                      <StatusIndicator label={t.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openTaskEdit(t)}
                      >
                        Reassign / Update
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Milestone Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Project Milestone</DialogTitle>
            <DialogDescription>
              The original planned date is permanently recorded for baseline variance analysis.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="font-medium text-[#172B4D]">Project</label>
                <select
                  {...form.register("projectId")}
                  className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-2.5"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-medium text-[#172B4D]">Site</label>
                <select
                  {...form.register("siteId")}
                  className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-2.5"
                >
                  {modalSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="font-medium text-[#172B4D]">Milestone Name</label>
              <input
                {...form.register("name")}
                placeholder="e.g., Level 20 Facade Handover"
                className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-3"
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-[#DC2626]">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="font-medium text-[#172B4D]">Scope Description</label>
              <textarea
                rows={2}
                {...form.register("description")}
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] p-2.5"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="font-medium text-[#172B4D]">Phase</label>
                <input
                  {...form.register("phase")}
                  className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-2.5"
                />
              </div>
              <div>
                <label className="font-medium text-[#172B4D]">Original Planned Date</label>
                <input
                  type="date"
                  {...form.register("originalPlannedDate")}
                  className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-2.5"
                />
              </div>
              <div>
                <label className="font-medium text-[#172B4D]">Responsible Person</label>
                <input
                  {...form.register("responsiblePerson")}
                  className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-2.5"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Baseline Milestone</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Milestone Dialog */}
      <Dialog open={Boolean(editingMs)} onOpenChange={(o) => !o && setEditingMs(null)}>
        <DialogContent className="max-w-md">
          {editingMs && (
            <>
              <DialogHeader>
                <DialogTitle>Update Milestone</DialogTitle>
                <DialogDescription>
                  Original baseline date ({formatDate(editingMs.originalPlannedDate)}) remains locked.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-medium text-[#172B4D]">Revised Target Date</label>
                  <input
                    type="date"
                    value={revisedDateInput}
                    onChange={(e) => setRevisedDateInput(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-3"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-[#172B4D]">Status</label>
                    <select
                      value={msStatusInput}
                      onChange={(e) => setMsStatusInput(e.target.value as MilestoneStatus)}
                      className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-2.5"
                    >
                      {Object.values(MilestoneStatus).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-medium text-[#172B4D]">Completion %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={msPercentInput}
                      onChange={(e) => setMsPercentInput(Number(e.target.value))}
                      className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-3"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-medium text-[#172B4D]">
                    Revision Reason (Required if date changed)
                  </label>
                  <textarea
                    rows={2}
                    value={msReasonInput}
                    onChange={(e) => setMsReasonInput(e.target.value)}
                    placeholder="Reason for schedule revision or progress update..."
                    className="mt-1 w-full rounded-lg border border-[#E2E8F0] p-2.5"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setEditingMs(null)}>
                    Cancel
                  </Button>
                  <Button onClick={saveMilestoneRevision}>Save Update</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Revision History Dialog */}
      <Dialog open={Boolean(historyMs)} onOpenChange={(o) => !o && setHistoryMs(null)}>
        <DialogContent className="max-w-md">
          {historyMs && (
            <>
              <DialogHeader>
                <DialogTitle>Milestone Baseline & Revision Log</DialogTitle>
                <DialogDescription>{historyMs.name}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-xs">
                <div className="rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] p-3">
                  <span className="text-[#64748B]">Original Planned Baseline:</span>{" "}
                  <span className="font-semibold text-[#172B4D]">
                    {formatDate(historyMs.originalPlannedDate)}
                  </span>
                </div>
                {historyMs.revisionHistory.length === 0 ? (
                  <p className="text-[#64748B]">No date revisions recorded.</p>
                ) : (
                  historyMs.revisionHistory.map((r, i) => (
                    <div key={i} className="rounded-lg border border-[#E2E8F0] p-3 space-y-1">
                      <p className="font-semibold text-[#172B4D]">
                        {formatDate(r.previousDate)} → {formatDate(r.newDate)}
                      </p>
                      <p className="text-[#64748B]">{r.reason}</p>
                      <p className="text-[11px] text-slate-400">
                        Updated {formatDate(r.date)} by {r.updatedBy}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reassign Task Dialog */}
      <Dialog open={Boolean(editingTask)} onOpenChange={(o) => !o && setEditingTask(null)}>
        <DialogContent className="max-w-md">
          {editingTask && (
            <>
              <DialogHeader>
                <DialogTitle>Update / Reassign Task</DialogTitle>
                <DialogDescription>{editingTask.name}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-medium text-[#172B4D]">
                    Assigned Site Manager / Engineer
                  </label>
                  <input
                    value={taskOwner}
                    onChange={(e) => setTaskOwner(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-3"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-[#172B4D]">Status</label>
                    <select
                      value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                      className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-2.5"
                    >
                      {Object.values(TaskStatus).map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-medium text-[#172B4D]">Progress %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={taskProgress}
                      onChange={(e) => setTaskProgress(Number(e.target.value))}
                      className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-3"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setEditingTask(null)}>
                    Cancel
                  </Button>
                  <Button onClick={saveTaskUpdate}>Save Assignment</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
