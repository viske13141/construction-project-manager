import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
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
import { toast } from "sonner";

export function BudgetCostControlPage() {
  const {
    projects,
    budgetBreakdowns,
    costRecords,
    selectedProjectId,
    submitBudgetRevision,
  } = usePMStore();

  const [projectFilter, setProjectFilter] = useState(
    selectedProjectId === "ALL" ? "ALL" : selectedProjectId
  );
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revProjectId, setRevProjectId] = useState(projects[1]?.id ?? projects[0]?.id ?? "");
  const [revAmount, setRevAmount] = useState("2500000");
  const [revReason, setRevReason] = useState("");

  const scopedProjects = useMemo(
    () =>
      projectFilter === "ALL"
        ? projects
        : projects.filter((p) => p.id === projectFilter),
    [projects, projectFilter]
  );

  const totals = useMemo(() => {
    const approved = scopedProjects.reduce((a, p) => a + p.approvedBudgetInr, 0);
    const revised = scopedProjects.reduce((a, p) => a + p.revisedBudgetInr, 0);
    const committed = scopedProjects.reduce((a, p) => a + p.committedCostInr, 0);
    const approvedExp = scopedProjects.reduce((a, p) => a + p.approvedExpenditureInr, 0);
    const paid = scopedProjects.reduce((a, p) => a + p.paidExpenditureInr, 0);
    const forecast = scopedProjects.reduce((a, p) => a + p.forecastedFinalCostInr, 0);
    return {
      approved,
      revised,
      committed,
      approvedExp,
      paid,
      remaining: Math.max(0, revised - approvedExp),
      forecast,
      variance: revised - forecast,
    };
  }, [scopedProjects]);

  const categoryTotals = useMemo(() => {
    const map = new Map<
      string,
      { category: string; approved: number; committed: number; approvedExp: number; paid: number }
    >();
    budgetBreakdowns
      .filter((b) => projectFilter === "ALL" || b.projectId === projectFilter)
      .forEach((b) => {
        const curr = map.get(b.category) ?? {
          category: b.category,
          approved: 0,
          committed: 0,
          approvedExp: 0,
          paid: 0,
        };
        curr.approved += b.approvedInr;
        curr.committed += b.committedInr;
        curr.approvedExp += b.approvedExpenseInr;
        curr.paid += b.paidInr;
        map.set(b.category, curr);
      });
    return Array.from(map.values());
  }, [budgetBreakdowns, projectFilter]);

  const chartCategoryData = categoryTotals.map((c) => ({
    category: c.category,
    Approved: Number((c.approved / 10000000).toFixed(2)),
    Committed: Number((c.committed / 10000000).toFixed(2)),
    Paid: Number((c.paid / 10000000).toFixed(2)),
  }));

  const scopedRecords = useMemo(
    () =>
      costRecords.filter(
        (r) => projectFilter === "ALL" || r.projectId === projectFilter
      ),
    [costRecords, projectFilter]
  );

  const overrunProjects = scopedProjects.filter(
    (p) => p.forecastedFinalCostInr > p.revisedBudgetInr
  );

  const handleRevisionSubmit = () => {
    const amountNum = Number(revAmount);
    if (!amountNum || amountNum <= 0 || revReason.trim().length < 10) {
      toast.error("Enter a positive revision amount and detailed justification.");
      return;
    }
    submitBudgetRevision(revProjectId, amountNum, revReason.trim());
    toast.success("Budget revision request submitted to Company Admin & Finance.");
    setRevisionOpen(false);
    setRevReason("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Overview", to: "/" }, { label: "Budget & Cost Control" }]}
        title="Project Budget & Cost Control"
        subtitle="Track approved budgets, PO commitments, approved expenditures, paid settlements, and forecasted final costs."
        meta="Financial Rule: Pending POs and unapproved claims are never counted as Paid Expenditure · Finance executes final payouts · Sample Data"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter budget by project"
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
            <Button onClick={() => setRevisionOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Request Budget Revision</span>
            </Button>
          </div>
        }
      />

      {/* Budget Alerts */}
      {overrunProjects.length > 0 && (
        <InlineAlertCallout
          tone="danger"
          title={`${overrunProjects.length} project(s) forecasting cost overrun above revised baseline`}
          description={overrunProjects
            .map(
              (p) =>
                `${p.name}: Forecast ${formatINR(p.forecastedFinalCostInr, true)} vs Revised ${formatINR(p.revisedBudgetInr, true)}`
            )
            .join(" · ")}
        />
      )}

      {/* 6 Separated Financial Buckets */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6 text-xs tabular-nums">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <span className="text-[#64748B]">Approved Baseline</span>
          <p className="mt-1 text-lg font-semibold text-[#172B4D]">
            {formatINR(totals.approved, true)}
          </p>
          <span className="text-[11px] text-[#64748B]">
            Rev: {formatINR(totals.revised, true)}
          </span>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <span className="text-[#64748B]">Committed Cost</span>
          <p className="mt-1 text-lg font-semibold text-[#7C3AED]">
            {formatINR(totals.committed, true)}
          </p>
          <span className="text-[11px] text-[#64748B]">Open POs & contracts</span>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <span className="text-[#64748B]">Approved Expense</span>
          <p className="mt-1 text-lg font-semibold text-[#2563EB]">
            {formatINR(totals.approvedExp, true)}
          </p>
          <span className="text-[11px] text-[#64748B]">Cleared for Finance</span>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <span className="text-[#64748B]">Paid Expenditure</span>
          <p className="mt-1 text-lg font-semibold text-[#16A34A]">
            {formatINR(totals.paid, true)}
          </p>
          <span className="text-[11px] text-[#64748B]">Disbursed by Finance</span>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <span className="text-[#64748B]">Remaining Budget</span>
          <p className="mt-1 text-lg font-semibold text-[#172B4D]">
            {formatINR(totals.remaining, true)}
          </p>
          <span className="text-[11px] text-[#64748B]">Revised - Approved Exp</span>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <span className="text-[#64748B]">Forecasted Final</span>
          <p
            className={cn(
              "mt-1 text-lg font-semibold",
              totals.variance < 0 ? "text-[#DC2626]" : "text-[#16A34A]"
            )}
          >
            {formatINR(totals.forecast, true)}
          </p>
          <span className="text-[11px] text-[#64748B]">
            Var: {totals.variance >= 0 ? "+" : ""}
            {formatINR(totals.variance, true)}
          </span>
        </div>
      </div>

      {/* Category Chart & Table */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-6 rounded-xl border border-[#E2E8F0] bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-[#172B4D]">
            Cost by Category (₹ Crores)
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartCategoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: "#64748B" }} />
                <YAxis unit=" Cr" tick={{ fontSize: 11, fill: "#64748B" }} />
                <Tooltip formatter={(v) => `₹${v ?? 0} Cr`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Approved" fill="#101F35" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Committed" fill="#7C3AED" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Paid" fill="#16A34A" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-6 rounded-xl border border-[#E2E8F0] bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-[#172B4D]">
            Category Breakdown Ledger
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs tabular-nums">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase">
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 px-2 text-right">Approved</th>
                  <th className="py-2 px-2 text-right">Committed</th>
                  <th className="py-2 px-2 text-right">App. Exp</th>
                  <th className="py-2 pl-2 text-right">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {categoryTotals.map((c) => (
                  <tr key={c.category}>
                    <td className="py-2.5 pr-3 font-medium text-[#172B4D]">{c.category}</td>
                    <td className="py-2.5 px-2 text-right">{formatINR(c.approved, true)}</td>
                    <td className="py-2.5 px-2 text-right text-[#7C3AED]">
                      {formatINR(c.committed, true)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-[#2563EB]">
                      {formatINR(c.approvedExp, true)}
                    </td>
                    <td className="py-2.5 pl-2 text-right font-semibold text-[#16A34A]">
                      {formatINR(c.paid, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cost Records Ledger */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-3">
        <h2 className="text-sm font-semibold text-[#172B4D]">
          Recent Cost & Expense Records (Separated by Stage)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F5F7FA] text-[11px] font-semibold uppercase text-[#64748B]">
                <th className="py-2.5 px-3">Ref & Date</th>
                <th className="py-2.5 px-3">Project & Category</th>
                <th className="py-2.5 px-3">Description & Vendor</th>
                <th className="py-2.5 px-3 text-right">Amount (INR)</th>
                <th className="py-2.5 px-3 text-right">Financial Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {scopedRecords.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 px-3 tabular-nums">
                    <p className="font-mono font-semibold text-[#172B4D]">{r.referenceNo}</p>
                    <p className="text-[#64748B]">{formatDate(r.recordedDate)}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-medium text-[#172B4D]">{r.projectName}</p>
                    <p className="text-[#64748B]">{r.category}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="text-[#172B4D]">{r.description}</p>
                    <p className="text-[#64748B]">
                      {r.vendorOrPayee} · {r.remarks}
                    </p>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums">
                    {formatINR(r.amountInr)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <StatusIndicator
                      label={r.stage}
                      tone={
                        r.stage === "Paid Expense"
                          ? "success"
                          : r.stage === "Approved Expense"
                            ? "info"
                            : "purple"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Budget Revision Modal */}
      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Budget Revision Request</DialogTitle>
            <DialogDescription>
              Budget revisions route to Company Admin & Finance for maker-checker sign-off.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-medium text-[#172B4D]">Project</label>
              <select
                value={revProjectId}
                onChange={(e) => setRevProjectId(e.target.value)}
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
              <label className="font-medium text-[#172B4D]">
                Additional Budget Requested (INR)
              </label>
              <input
                type="number"
                value={revAmount}
                onChange={(e) => setRevAmount(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-3 font-mono"
              />
            </div>
            <div>
              <label className="font-medium text-[#172B4D]">Justification & Cost Drivers</label>
              <textarea
                rows={3}
                value={revReason}
                onChange={(e) => setRevReason(e.target.value)}
                placeholder="Explain BOQ variance, price escalation, or client scope change..."
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] p-2.5"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRevisionOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRevisionSubmit}>Submit for Approval</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
