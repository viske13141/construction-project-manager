import { useMemo, useState } from "react";
import { Check, FileText, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { usePMStore } from "../../store/pmStore";
import { formatDate, formatINR } from "../../lib/utils";
import { ApprovalItem, ApprovalStatus } from "../../types/projectManager";
import { PageHeader } from "../../components/shared/PageHeader";
import { InlineAlertCallout, StatusIndicator } from "../../components/shared/StatusIndicator";
import { Button } from "../../components/ui/button";
import { ConfirmActionDialog } from "../../components/shared/ConfirmActionDialog";
import { toast } from "sonner";

export function ApprovalsPage() {
  const { profile, approvals, projects, selectedProjectId, decideApproval } = usePMStore();

  const [projectFilter, setProjectFilter] = useState(
    selectedProjectId === "ALL" ? "ALL" : selectedProjectId
  );
  const [statusFilter, setStatusFilter] = useState("All");
  const [pendingAction, setPendingAction] = useState<{
    item: ApprovalItem;
    decision: ApprovalStatus;
  } | null>(null);

  const filteredApprovals = useMemo(
    () =>
      approvals.filter((a) => {
        if (projectFilter !== "ALL" && a.projectId !== projectFilter) return false;
        if (statusFilter !== "All" && a.status !== statusFilter) return false;
        return true;
      }),
    [approvals, projectFilter, statusFilter]
  );

  const handleConfirm = (remarks: string) => {
    if (!pendingAction) return;
    const res = decideApproval(
      pendingAction.item.id,
      pendingAction.decision,
      remarks
    );
    if (!res.ok) {
      toast.error(res.error ?? "Action blocked by governance policy.");
      return;
    }
    toast.success(
      `${pendingAction.item.requestNumber} updated to ${pendingAction.decision}.`
    );
    setPendingAction(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Overview", to: "/" }, { label: "Approvals" }]}
        title="Project Manager Approval Centre"
        subtitle="Review purchase requests, material requisitions, contractor verifications, schedule changes, and resource requests within your authority."
        meta={`Configured PM Sign-Off Limit: ${formatINR(profile.approvalAuthorityLimitInr)} · Maker-Checker Active · Sample Data`}
        actions={
          <select
            aria-label="Filter approvals by project"
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
        }
      />

      <InlineAlertCallout
        tone="info"
        title="Authority Threshold & Maker-Checker Separation"
        description={`Requests up to ${formatINR(profile.approvalAuthorityLimitInr)} can be approved directly by you. Higher amounts require escalation to Company Admin / Finance, and self-submitted requests cannot be self-approved.`}
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {["All", "Pending", "Approved", "Changes Requested", "Escalated", "Rejected"].map(
          (st) => (
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
          )
        )}
      </div>

      <div className="space-y-4">
        {filteredApprovals.map((item) => {
          const isSelfSubmitted = item.submittedBy
            .toLowerCase()
            .includes(profile.name.toLowerCase());
          const exceedsAuthority =
            item.amountInr !== null &&
            item.amountInr > profile.approvalAuthorityLimitInr;
          const canAct =
            item.status === ApprovalStatus.PENDING ||
            item.status === ApprovalStatus.CHANGES_REQUESTED;

          return (
            <div
              key={item.id}
              className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-mono text-[#64748B]">
                    {item.requestNumber} · {item.category} · {formatDate(item.submittedDate)}
                  </p>
                  <h3 className="text-base font-semibold text-[#172B4D]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    {item.projectName} · {item.siteName} · Submitted by{" "}
                    <strong className="text-[#172B4D]">{item.submittedBy}</strong>
                  </p>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
                  <StatusIndicator label={item.status} />
                  {item.amountInr !== null && (
                    <span className="font-mono text-base font-semibold text-[#172B4D] tabular-nums">
                      {formatINR(item.amountInr)}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-[#64748B]">{item.description}</p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B]">
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Docs: {item.supportingDocs.join(", ")}
                </span>
                {exceedsAuthority && (
                  <span className="inline-flex items-center gap-1 font-medium text-[#7C3AED]">
                    <ShieldAlert className="h-3.5 w-3.5" /> Exceeds PM ₹5L limit
                  </span>
                )}
                {isSelfSubmitted && (
                  <span className="inline-flex items-center gap-1 font-medium text-[#B45309]">
                    <ShieldCheck className="h-3.5 w-3.5" /> Maker-checker: Self-submitted
                  </span>
                )}
              </div>

              {item.previousHistory.length > 0 && (
                <div className="rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] px-3 py-2 text-[11px] text-[#64748B]">
                  <strong>History:</strong> {item.previousHistory.join(" → ")}
                </div>
              )}

              {canAct && (
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#E2E8F0] pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setPendingAction({
                        item,
                        decision: ApprovalStatus.CHANGES_REQUESTED,
                      })
                    }
                  >
                    Request Changes
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      setPendingAction({
                        item,
                        decision: ApprovalStatus.REJECTED,
                      })
                    }
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Reject</span>
                  </Button>
                  {exceedsAuthority ? (
                    <Button
                      size="sm"
                      variant="navy"
                      onClick={() =>
                        setPendingAction({
                          item,
                          decision: ApprovalStatus.ESCALATED,
                        })
                      }
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>Endorse & Escalate to Admin</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="success"
                      disabled={isSelfSubmitted}
                      onClick={() =>
                        setPendingAction({
                          item,
                          decision: ApprovalStatus.APPROVED,
                        })
                      }
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Approve</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmActionDialog
        open={Boolean(pendingAction)}
        onOpenChange={(o) => !o && setPendingAction(null)}
        title={
          pendingAction
            ? `${pendingAction.decision}: ${pendingAction.item.requestNumber}`
            : ""
        }
        description={pendingAction?.item.title ?? ""}
        confirmLabel={`Confirm ${pendingAction?.decision ?? ""}`}
        confirmVariant={
          pendingAction?.decision === ApprovalStatus.REJECTED
            ? "destructive"
            : pendingAction?.decision === ApprovalStatus.APPROVED
              ? "success"
              : "default"
        }
        requireReason
        onConfirm={handleConfirm}
      />
    </div>
  );
}
