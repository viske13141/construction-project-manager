import { useMemo, useState } from "react";
import { CheckCircle2, PackageCheck, ShieldAlert } from "lucide-react";
import { usePMStore } from "../../store/pmStore";
import { cn, formatDate, formatINR } from "../../lib/utils";
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
import { MaterialRequest } from "../../types/projectManager";
import { toast } from "sonner";

export function MaterialsProcurementPage() {
  const {
    projects,
    materialRequests,
    selectedProjectId,
    approveMaterialRequest,
    verifyMaterialReceipt,
  } = usePMStore();

  const [projectFilter, setProjectFilter] = useState(
    selectedProjectId === "ALL" ? "ALL" : selectedProjectId
  );
  const [receiptTarget, setReceiptTarget] = useState<MaterialRequest | null>(null);
  const [receivedQty, setReceivedQty] = useState("");

  const scopedRequests = useMemo(
    () =>
      materialRequests.filter(
        (m) => projectFilter === "ALL" || m.projectId === projectFilter
      ),
    [materialRequests, projectFilter]
  );

  const shortages = scopedRequests.filter(
    (m) => m.currentSiteStock < m.minimumThreshold
  );

  const openVerifyReceipt = (item: MaterialRequest) => {
    setReceiptTarget(item);
    setReceivedQty(String(item.quantity));
  };

  const confirmVerifyReceipt = () => {
    if (!receiptTarget) return;
    const qty = Number(receivedQty);
    if (!qty || qty <= 0) {
      toast.error("Enter a valid verified receipt quantity.");
      return;
    }
    verifyMaterialReceipt(receiptTarget.id, qty);
    toast.success(
      `Material receipt verified (${qty} ${receiptTarget.unit}). Site inventory updated.`
    );
    setReceiptTarget(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Overview", to: "/" },
          { label: "Materials & Procurement" },
        ]}
        title="Materials & Procurement Monitoring"
        subtitle="Track material requisitions, purchase orders, transit deliveries, verified site receipts, and stock shortages."
        meta="PM Authority: Up to ₹5,00,000 per requisition · Higher requests escalate to Company Admin · Sample Data"
        actions={
          <select
            aria-label="Filter materials by project"
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

      {/* Governance Rule Banner */}
      <InlineAlertCallout
        tone="info"
        title="Procurement Receipt Verification Rule"
        description="A submitted vendor bill or issued Purchase Order (PO) is NOT proof of delivery. Site inventory quantities update only after authorized Material Receipt Verification."
      />

      {/* Shortage Alerts */}
      {shortages.length > 0 && (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[#DC2626]" />
            <h2 className="text-sm font-semibold text-[#172B4D]">
              Active Material Shortage Alerts ({shortages.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {shortages.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-[#DC2626]/25 bg-[#DC2626]/5 p-3.5 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-[#DC2626]">
                    {s.requestNumber}
                  </span>
                  <StatusIndicator label={s.priority} />
                </div>
                <p className="font-semibold text-[#172B4D]">{s.materialName}</p>
                <p className="text-[#64748B]">
                  {s.projectName} · {s.siteName}
                </p>
                <p className="tabular-nums font-medium text-[#DC2626]">
                  On-Site Stock: {s.currentSiteStock} {s.unit} (Min Buffer:{" "}
                  {s.minimumThreshold} {s.unit})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Material Requests & Delivery Table */}
      <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F5F7FA] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              <th className="py-3 px-4">Request # & Date</th>
              <th className="py-3 px-3">Material & Site</th>
              <th className="py-3 px-3 text-right">Qty / Est. Cost</th>
              <th className="py-3 px-3 text-right">Site Stock</th>
              <th className="py-3 px-3">Approval</th>
              <th className="py-3 px-3">Delivery / PO</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {scopedRequests.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4 tabular-nums">
                  <p className="font-mono font-semibold text-[#172B4D]">
                    {m.requestNumber}
                  </p>
                  <p className="text-[#64748B]">{formatDate(m.requestDate)}</p>
                </td>
                <td className="py-3 px-3">
                  <p className="font-semibold text-[#172B4D]">{m.materialName}</p>
                  <p className="text-[#64748B]">
                    {m.projectName} · {m.siteName}
                  </p>
                </td>
                <td className="py-3 px-3 text-right tabular-nums">
                  <p className="font-semibold text-[#172B4D]">
                    {m.quantity} {m.unit}
                  </p>
                  <p className="text-[#64748B]">{formatINR(m.estimatedCostInr)}</p>
                </td>
                <td
                  className={cn(
                    "py-3 px-3 text-right tabular-nums font-semibold",
                    m.currentSiteStock < m.minimumThreshold
                      ? "text-[#DC2626]"
                      : "text-[#16A34A]"
                  )}
                >
                  {m.currentSiteStock} {m.unit}
                </td>
                <td className="py-3 px-3">
                  <StatusIndicator label={m.approvalStatus} />
                </td>
                <td className="py-3 px-3">
                  <StatusIndicator label={m.deliveryStatus} />
                  {m.poNumber && (
                    <p className="mt-1 font-mono text-[11px] text-[#64748B]">
                      {m.poNumber}
                    </p>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    {m.approvalStatus === "Pending PM" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          approveMaterialRequest(m.id);
                          toast.success(
                            m.estimatedCostInr <= 500000
                              ? `Approved ${m.requestNumber} within PM authority.`
                              : `Escalated ${m.requestNumber} to Company Admin.`
                          );
                        }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>
                          {m.estimatedCostInr <= 500000 ? "Approve PO" : "Escalate"}
                        </span>
                      </Button>
                    )}
                    {["PO Issued", "In Transit"].includes(m.deliveryStatus) && (
                      <Button size="sm" onClick={() => openVerifyReceipt(m)}>
                        <PackageCheck className="h-3.5 w-3.5" />
                        <span>Verify Receipt</span>
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Material Receipt Verification Dialog */}
      <Dialog
        open={Boolean(receiptTarget)}
        onOpenChange={(o) => !o && setReceiptTarget(null)}
      >
        <DialogContent className="max-w-md">
          {receiptTarget && (
            <>
              <DialogHeader>
                <DialogTitle>Verify Material Receipt</DialogTitle>
                <DialogDescription>
                  {receiptTarget.requestNumber} · {receiptTarget.materialName} (PO:{" "}
                  {receiptTarget.poNumber})
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-xs">
                <p className="text-[#64748B]">
                  Confirm physical weighbridge / gate-pass quantity received at{" "}
                  <strong className="text-[#172B4D]">{receiptTarget.siteName}</strong>{" "}
                  before updating site inventory.
                </p>
                <div>
                  <label className="font-medium text-[#172B4D]">
                    Verified Received Quantity ({receiptTarget.unit})
                  </label>
                  <input
                    type="number"
                    value={receivedQty}
                    onChange={(e) => setReceivedQty(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-3 font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setReceiptTarget(null)}>
                    Cancel
                  </Button>
                  <Button variant="success" onClick={confirmVerifyReceipt}>
                    Confirm Receipt & Update Inventory
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
