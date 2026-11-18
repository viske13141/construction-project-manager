import { useMemo, useState } from "react";
import { Camera, CheckCircle2, FileDown, History, MessageSquareWarning } from "lucide-react";
import { usePMStore } from "../../store/pmStore";
import { formatDate, formatDateTime } from "../../lib/utils";
import { DailyProgressReport } from "../../types/projectManager";
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
import { toast } from "sonner";

export function DailyProgressReportsPage() {
  const { projects, dailyReports, selectedProjectId, reviewDailyReport } = usePMStore();

  const [projectFilter, setProjectFilter] = useState(
    selectedProjectId === "ALL" ? "ALL" : selectedProjectId
  );
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeReport, setActiveReport] = useState<DailyProgressReport | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  const filteredReports = useMemo(
    () =>
      dailyReports.filter((r) => {
        if (projectFilter !== "ALL" && r.projectId !== projectFilter) return false;
        if (statusFilter !== "All" && r.reviewStatus !== statusFilter) return false;
        return true;
      }),
    [dailyReports, projectFilter, statusFilter]
  );

  const handleReviewAction = (action: "Reviewed" | "Correction Requested") => {
    if (!activeReport) return;
    if (action === "Correction Requested" && reviewComment.trim().length < 5) {
      toast.error("Please specify what correction is required from the Site Manager.");
      return;
    }
    reviewDailyReport(
      activeReport.id,
      action,
      reviewComment.trim() || "Verified and accepted by Project Manager."
    );
    toast.success(`DPR ${activeReport.reportCode} marked as ${action} (original submission preserved).`);
    setReviewComment("");
    setActiveReport(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Overview", to: "/" }, { label: "Daily Progress Reports" }]}
        title="Daily Progress Reports (DPR)"
        subtitle="Review site logs submitted by Site Managers & Engineers, inspect materials/safety notes, and preserve immutable revision histories."
        meta="Audit Rule: Original submitted DPRs are never silently overwritten; revisions append a new version · Sample Data"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter DPRs by project"
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
            <Button variant="outline" onClick={() => window.print()}>
              <FileDown className="h-4 w-4" />
              <span>Export PDF</span>
            </Button>
          </div>
        }
      />

      {/* Status Filter Segmented Controls */}
      <div className="flex flex-wrap items-center gap-1.5">
        {["All", "Pending Review", "Reviewed", "Correction Requested"].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === st
                ? "bg-[#101F35] text-white"
                : "bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#172B4D]"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* DPR Cards / List */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredReports.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-mono text-[#64748B]">
                  {r.reportCode} · {formatDate(r.reportingDate)} · {r.submittedBy}
                </p>
                <h3 className="mt-0.5 text-base font-semibold text-[#172B4D]">
                  {r.projectName}
                </h3>
                <p className="text-xs text-[#64748B]">{r.siteName}</p>
              </div>
              <StatusIndicator label={r.reviewStatus} />
            </div>

            <div className="rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] p-3 text-xs space-y-1.5">
              <p>
                <strong className="text-[#172B4D]">Work Completed:</strong>{" "}
                <span className="text-[#64748B]">{r.workCompleted}</span>
              </p>
              <p>
                <strong className="text-[#172B4D]">Delays Noted:</strong>{" "}
                <span className={r.delaysNoted !== "None" ? "text-[#DC2626]" : "text-[#64748B]"}>
                  {r.delaysNoted}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex items-center gap-3 text-[#64748B] tabular-nums">
                <span>Workforce: {r.workforcePresent}</span>
                <span>·</span>
                <span>+{r.dailyProgressPercent}% progress</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Camera className="h-3.5 w-3.5" /> {r.photoCount} photos
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setActiveReport(r);
                  setReviewComment(r.pmComments ?? "");
                }}
              >
                Inspect & Review
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed DPR Inspection Modal */}
      <Dialog
        open={Boolean(activeReport)}
        onOpenChange={(o) => !o && setActiveReport(null)}
      >
        <DialogContent className="max-w-2xl">
          {activeReport && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {activeReport.reportCode} — {activeReport.siteName}
                </DialogTitle>
                <DialogDescription>
                  {activeReport.projectName} · Submitted by {activeReport.submittedBy} at{" "}
                  {formatDateTime(activeReport.submittedAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-[#E2E8F0] p-3">
                    <p className="font-semibold text-[#172B4D]">Planned Work</p>
                    <p className="mt-1 text-[#64748B]">{activeReport.plannedWork}</p>
                  </div>
                  <div className="rounded-lg border border-[#E2E8F0] p-3">
                    <p className="font-semibold text-[#172B4D]">Actual Work Completed</p>
                    <p className="mt-1 text-[#64748B]">{activeReport.workCompleted}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-[#E2E8F0] p-3">
                    <p className="font-semibold text-[#172B4D]">Materials Consumed</p>
                    <ul className="mt-1 list-disc pl-4 text-[#64748B]">
                      {activeReport.materialsConsumed.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-[#E2E8F0] p-3">
                    <p className="font-semibold text-[#172B4D]">Equipment Used</p>
                    <ul className="mt-1 list-disc pl-4 text-[#64748B]">
                      {activeReport.equipmentUsed.map((eq) => (
                        <li key={eq}>{eq}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-[#E2E8F0] p-3">
                    <p className="font-semibold text-[#172B4D]">Safety & Quality Notes</p>
                    <p className="mt-1 text-[#64748B]">
                      Safety: {activeReport.safetyObservations}
                    </p>
                    <p className="mt-1 text-[#64748B]">
                      Quality: {activeReport.qualityObservations}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#E2E8F0] p-3">
                    <p className="font-semibold text-[#172B4D]">Next Day&apos;s Plan</p>
                    <p className="mt-1 text-[#64748B]">{activeReport.nextDayPlan}</p>
                  </div>
                </div>

                {/* Revision History */}
                <div className="rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] p-3 space-y-1.5">
                  <p className="inline-flex items-center gap-1.5 font-semibold text-[#172B4D]">
                    <History className="h-3.5 w-3.5" /> Submission & Revision History (Immutable)
                  </p>
                  {activeReport.revisions.map((rev) => (
                    <div key={rev.version} className="text-[#64748B]">
                      <span className="font-mono font-semibold text-[#172B4D]">
                        v{rev.version}
                      </span>{" "}
                      · {formatDateTime(rev.submittedAt)} by {rev.submittedBy} —{" "}
                      {rev.summary}
                      {rev.pmActionNote ? ` (${rev.pmActionNote})` : ""}
                    </div>
                  ))}
                </div>

                <div>
                  <label className="font-medium text-[#172B4D]">
                    PM Review Remarks (Required if requesting correction)
                  </label>
                  <textarea
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Add inspection feedback or correction instructions..."
                    className="mt-1 w-full rounded-lg border border-[#E2E8F0] p-2.5"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleReviewAction("Correction Requested")}
                  >
                    <MessageSquareWarning className="h-4 w-4 text-[#F59E0B]" />
                    <span>Request Correction</span>
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => handleReviewAction("Reviewed")}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Mark Reviewed</span>
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
