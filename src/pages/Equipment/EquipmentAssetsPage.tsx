import { useMemo, useState } from "react";
import { ArrowRightLeft, Wrench } from "lucide-react";
import { usePMStore } from "../../store/pmStore";
import { cn, formatDate } from "../../lib/utils";
import { PageHeader } from "../../components/shared/PageHeader";
import { InlineAlertCallout, StatusIndicator } from "../../components/shared/StatusIndicator";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { EquipmentAsset } from "../../types/projectManager";
import { toast } from "sonner";

export function EquipmentAssetsPage() {
  const { projects, sites, equipment, selectedProjectId, requestEquipmentTransfer } =
    usePMStore();

  const [projectFilter, setProjectFilter] = useState(
    selectedProjectId === "ALL" ? "ALL" : selectedProjectId
  );
  const [transferTarget, setTransferTarget] = useState<EquipmentAsset | null>(null);
  const [targetSite, setTargetSite] = useState(sites[0]?.name ?? "");
  const [transferReason, setTransferReason] = useState("");

  const scopedEquipment = useMemo(
    () =>
      equipment.filter(
        (e) => projectFilter === "ALL" || e.projectId === projectFilter
      ),
    [equipment, projectFilter]
  );

  const criticalEquipment = scopedEquipment.filter(
    (e) => e.availability === "Breakdown" || e.maintenanceStatus === "Overdue"
  );

  const handleTransferSubmit = () => {
    if (!transferTarget || transferReason.trim().length < 5) {
      toast.error("Please provide a transfer justification.");
      return;
    }
    requestEquipmentTransfer(transferTarget.id, targetSite, transferReason.trim());
    toast.success(`Equipment transfer request submitted for ${transferTarget.equipmentCode}.`);
    setTransferTarget(null);
    setTransferReason("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Overview", to: "/" }, { label: "Equipment & Assets" }]}
        title="Equipment & Asset Monitoring"
        subtitle="Track crane, plant, and heavy machinery utilization, breakdown downtime, maintenance alerts, and inter-site reassignments."
        meta={`Monitoring ${scopedEquipment.length} major assets across assigned projects · Sample Data`}
        actions={
          <select
            aria-label="Filter equipment by project"
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

      {criticalEquipment.length > 0 && (
        <InlineAlertCallout
          tone="danger"
          title={`${criticalEquipment.length} equipment unit(s) experiencing breakdown or overdue maintenance`}
          description={criticalEquipment
            .map(
              (e) =>
                `${e.equipmentCode} (${e.name}) at ${e.siteName}: ${e.availability} · Maintenance ${e.maintenanceStatus}`
            )
            .join(" | ")}
        />
      )}

      <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F5F7FA] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              <th className="py-3 px-4">Equipment</th>
              <th className="py-3 px-3">Assigned Project & Site</th>
              <th className="py-3 px-3">Operator</th>
              <th className="py-3 px-3 text-right">Utilization</th>
              <th className="py-3 px-3 text-right">30d Downtime</th>
              <th className="py-3 px-3">Availability</th>
              <th className="py-3 px-3">Maintenance</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {scopedEquipment.map((eq) => (
              <tr key={eq.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4">
                  <p className="font-semibold text-[#172B4D]">{eq.name}</p>
                  <p className="font-mono text-[#64748B]">
                    {eq.equipmentCode} · {eq.category}
                  </p>
                </td>
                <td className="py-3 px-3">
                  <p className="text-[#172B4D]">{eq.projectName}</p>
                  <p className="text-[#64748B]">{eq.siteName}</p>
                </td>
                <td className="py-3 px-3 text-[#172B4D]">{eq.operatorName}</td>
                <td className="py-3 px-3 text-right tabular-nums font-semibold">
                  {eq.utilizationPercent}%
                </td>
                <td
                  className={cn(
                    "py-3 px-3 text-right tabular-nums font-semibold",
                    eq.downtimeHours30d > 20 ? "text-[#DC2626]" : "text-[#172B4D]"
                  )}
                >
                  {eq.downtimeHours30d} hrs
                </td>
                <td className="py-3 px-3">
                  <StatusIndicator label={eq.availability} />
                </td>
                <td className="py-3 px-3">
                  <StatusIndicator label={eq.maintenanceStatus} />
                  <p className="mt-1 text-[11px] text-[#64748B] tabular-nums">
                    Next: {formatDate(eq.nextMaintenanceDate)}
                  </p>
                </td>
                <td className="py-3 px-4 text-right">
                  {eq.reassignmentRequestedTo ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2563EB]">
                      <Wrench className="h-3 w-3" /> Transfer → {eq.reassignmentRequestedTo}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTransferTarget(eq)}
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      <span>Reassign</span>
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={Boolean(transferTarget)}
        onOpenChange={(o) => !o && setTransferTarget(null)}
      >
        <DialogContent className="max-w-md">
          {transferTarget && (
            <>
              <DialogHeader>
                <DialogTitle>Request Inter-Site Equipment Transfer</DialogTitle>
                <DialogDescription>
                  {transferTarget.equipmentCode} · {transferTarget.name} (Currently at{" "}
                  {transferTarget.siteName})
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-medium text-[#172B4D]">Destination Site</label>
                  <select
                    value={targetSite}
                    onChange={(e) => setTargetSite(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-2.5"
                  >
                    {sites
                      .filter((s) => s.id !== transferTarget.siteId)
                      .map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.code} · {s.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="font-medium text-[#172B4D]">Transfer Justification</label>
                  <textarea
                    rows={2}
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="Specify mobilization window and site readiness..."
                    className="mt-1 w-full rounded-lg border border-[#E2E8F0] p-2.5"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setTransferTarget(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleTransferSubmit}>Submit Transfer Request</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
