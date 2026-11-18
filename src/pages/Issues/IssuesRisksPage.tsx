import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Plus, ShieldAlert } from "lucide-react";
import { usePMStore } from "../../store/pmStore";
import { formatDate } from "../../lib/utils";
import { IssueCategory, IssueStatus, PriorityLevel, ProjectIssue } from "../../types/projectManager";
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

const createIssueSchema = z.object({
  projectId: z.string().min(1),
  siteId: z.string().min(1),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(8, "Describe the operational issue"),
  category: z.nativeEnum(IssueCategory),
  priority: z.nativeEnum(PriorityLevel),
  assignedTo: z.string().min(2, "Assign a responsible owner"),
  dueDate: z.string().min(1),
});

type CreateIssueForm = z.infer<typeof createIssueSchema>;

export function IssuesRisksPage() {
  const {
    projects,
    sites,
    issues,
    risks,
    selectedProjectId,
    createIssue,
    updateIssueStatus,
  } = usePMStore();

  const [projectFilter, setProjectFilter] = useState(
    selectedProjectId === "ALL" ? "ALL" : selectedProjectId
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<ProjectIssue | null>(null);
  const [nextStatus, setNextStatus] = useState<IssueStatus>(IssueStatus.IN_PROGRESS);
  const [remarks, setRemarks] = useState("");
  const [escalateFlag, setEscalateFlag] = useState(false);

  const scopedIssues = useMemo(
    () =>
      issues.filter((i) => projectFilter === "ALL" || i.projectId === projectFilter),
    [issues, projectFilter]
  );

  const scopedRisks = useMemo(
    () => risks.filter((r) => projectFilter === "ALL" || r.projectId === projectFilter),
    [risks, projectFilter]
  );

  const form = useForm<CreateIssueForm>({
    resolver: zodResolver(createIssueSchema),
    defaultValues: {
      projectId: projects[0]?.id ?? "",
      siteId: sites[0]?.id ?? "",
      title: "",
      description: "",
      category: IssueCategory.CONSTRUCTION_DELAY,
      priority: PriorityLevel.HIGH,
      assignedTo: "Ramesh Kulkarni",
      dueDate: "2026-11-25",
    },
  });

  const watchedProject = form.watch("projectId");
  const modalSites = useMemo(
    () => sites.filter((s) => s.projectId === watchedProject),
    [sites, watchedProject]
  );

  const onCreateSubmit = (data: CreateIssueForm) => {
    createIssue(data);
    toast.success(`Issue "${data.title}" logged and assigned to ${data.assignedTo}.`);
    form.reset();
    setCreateOpen(false);
  };

  const openIssueDrawer = (iss: ProjectIssue) => {
    setSelectedIssue(iss);
    setNextStatus(iss.status);
    setRemarks("");
    setEscalateFlag(iss.escalatedToAdmin);
  };

  const saveIssueUpdate = () => {
    if (!selectedIssue) return;
    if (remarks.trim().length < 5) {
      toast.error("Please enter resolution or escalation remarks.");
      return;
    }
    updateIssueStatus(selectedIssue.id, nextStatus, remarks.trim(), escalateFlag);
    toast.success(
      escalateFlag
        ? `${selectedIssue.issueCode} escalated to Company Admin.`
        : `${selectedIssue.issueCode} updated to ${nextStatus}.`
    );
    setSelectedIssue(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Overview", to: "/" }, { label: "Issues & Risks" }]}
        title="Project Issues & Risk Register"
        subtitle="Manage site delays, safety incidents, quality defects, and proactive project risks with full escalation history."
        meta="Critical safety and overrun risks escalate directly to Company Admin · Sample Data"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter issues by project"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs font-medium text-[#172B4D]"
            >
              <option value="ALL">All Assigned Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.name}
                </option>
              ))}
            </select>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Report Issue</span>
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="issues">
        <TabsList>
          <TabsTrigger value="issues">Issue Tracker ({scopedIssues.length})</TabsTrigger>
          <TabsTrigger value="risks">Risk Register ({scopedRisks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F5F7FA] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  <th className="py-3 px-4">Issue & Category</th>
                  <th className="py-3 px-3">Project & Site</th>
                  <th className="py-3 px-3">Assigned Owner</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {scopedIssues.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#172B4D]">
                        <span className="font-mono text-[#64748B] mr-1.5">{i.issueCode}</span>
                        {i.title}
                      </p>
                      <p className="text-[#64748B]">
                        {i.category} · Reported by {i.reportedBy}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-[#172B4D]">{i.projectName}</p>
                      <p className="text-[#64748B]">{i.siteName}</p>
                    </td>
                    <td className="py-3 px-3 text-[#172B4D]">{i.assignedTo}</td>
                    <td className="py-3 px-3">
                      <StatusIndicator label={i.priority} />
                    </td>
                    <td className="py-3 px-3 tabular-nums text-[#64748B]">
                      {formatDate(i.dueDate)}
                    </td>
                    <td className="py-3 px-3">
                      <StatusIndicator label={i.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openIssueDrawer(i)}
                      >
                        Manage / Escalate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="risks">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scopedRisks.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-[#64748B]">{r.category}</span>
                  <StatusIndicator label={r.status} />
                </div>
                <h3 className="text-sm font-semibold text-[#172B4D]">{r.title}</h3>
                <p className="text-[#64748B]">{r.projectName}</p>
                <div className="flex items-center gap-4 border-y border-[#E2E8F0] py-2">
                  <span>
                    Likelihood: <strong>{r.likelihood}</strong>
                  </span>
                  <span>
                    Impact: <strong className="text-[#DC2626]">{r.impact}</strong>
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-[#172B4D]">Mitigation Plan:</span>
                  <p className="mt-0.5 text-[#64748B]">{r.mitigationPlan}</p>
                </div>
                <p className="text-[11px] text-[#64748B]">Owner: {r.owner}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Log New Issue Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#F59E0B]" />
              Report Project Issue
            </DialogTitle>
            <DialogDescription>
              Log a field or operational issue within your assigned projects.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
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
              <label className="font-medium text-[#172B4D]">Issue Title</label>
              <input
                {...form.register("title")}
                placeholder="e.g., Cube strength below M35 threshold on Pier P19"
                className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-3"
              />
            </div>
            <div>
              <label className="font-medium text-[#172B4D]">Description</label>
              <textarea
                rows={2}
                {...form.register("description")}
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] p-2.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-[#172B4D]">Category</label>
                <select
                  {...form.register("category")}
                  className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-2.5"
                >
                  {Object.values(IssueCategory).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-medium text-[#172B4D]">Priority</label>
                <select
                  {...form.register("priority")}
                  className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-2.5"
                >
                  {Object.values(PriorityLevel).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-[#172B4D]">Assign To</label>
                <input
                  {...form.register("assignedTo")}
                  className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-3"
                />
              </div>
              <div>
                <label className="font-medium text-[#172B4D]">Resolution Due Date</label>
                <input
                  type="date"
                  {...form.register("dueDate")}
                  className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-3"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Log Issue</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage / Escalate Issue Dialog */}
      <Dialog
        open={Boolean(selectedIssue)}
        onOpenChange={(o) => !o && setSelectedIssue(null)}
      >
        <DialogContent className="max-w-lg">
          {selectedIssue && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedIssue.issueCode} — {selectedIssue.title}
                </DialogTitle>
                <DialogDescription>
                  {selectedIssue.projectName} · {selectedIssue.siteName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-xs">
                <p className="text-[#172B4D]">{selectedIssue.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-[#172B4D]">Update Status</label>
                    <select
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value as IssueStatus)}
                      className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-2.5"
                    >
                      {Object.values(IssueStatus).map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-[#7C3AED]">
                      <input
                        type="checkbox"
                        checked={escalateFlag}
                        onChange={(e) => {
                          setEscalateFlag(e.target.checked);
                          if (e.target.checked) setNextStatus(IssueStatus.ESCALATED);
                        }}
                      />
                      <ShieldAlert className="h-4 w-4" />
                      <span>Escalate to Company Admin</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="font-medium text-[#172B4D]">
                    Verification / Resolution Remarks *
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Record evidence review or escalation instructions..."
                    className="mt-1 w-full rounded-lg border border-[#E2E8F0] p-2.5"
                  />
                </div>
                <div className="border-t border-[#E2E8F0] pt-3 space-y-1.5">
                  <p className="font-semibold text-[#172B4D]">Activity History</p>
                  {selectedIssue.history.map((h, idx) => (
                    <p key={idx} className="text-[#64748B]">
                      <span className="font-mono">{h.timestamp}</span> ·{" "}
                      <strong>{h.actor}</strong>: {h.note}
                    </p>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedIssue(null)}>
                    Close
                  </Button>
                  <Button onClick={saveIssueUpdate}>Save Update</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
