import { useState } from "react";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { usePMStore } from "../../store/pmStore";
import { formatINR } from "../../lib/utils";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatusIndicator } from "../../components/shared/StatusIndicator";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

export function MyProfilePage() {
  const { profile, projects } = usePMStore();
  const assignedProjects = projects.filter((p) =>
    profile.assignedProjectIds.includes(p.id)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Overview", to: "/" }, { label: "My Profile" }]}
        title="Project Manager Profile & Permissions"
        subtitle="View your assigned project scope, configured approval limits, and Company Admin RBAC boundaries."
        meta={`${profile.organizationName} · Employee Code ${profile.employeeCode}`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="h-16 w-16 rounded-xl object-cover border border-[#E2E8F0]"
            />
            <div>
              <h2 className="text-lg font-semibold text-[#172B4D]">{profile.name}</h2>
              <p className="text-xs text-[#64748B]">{profile.designation}</p>
              <p className="mt-1 text-xs font-mono text-[#2563EB]">{profile.email}</p>
            </div>
          </div>

          <div className="divide-y divide-[#E2E8F0] border-t border-[#E2E8F0] pt-2 text-xs">
            <div className="flex justify-between py-2.5">
              <span className="text-[#64748B]">Organization</span>
              <span className="font-medium text-[#172B4D]">{profile.organizationName}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#64748B]">Phone</span>
              <span className="font-mono text-[#172B4D]">{profile.phone}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#64748B]">Reporting Timezone</span>
              <span className="text-[#172B4D]">{profile.timezone}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#64748B]">Approval Authority Limit</span>
              <span className="font-mono font-semibold text-[#172B4D]">
                {formatINR(profile.approvalAuthorityLimitInr)}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Assigned Projects ({assignedProjects.length})
            </h3>
            <div className="space-y-1.5 text-xs">
              {assignedProjects.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-[#E2E8F0] px-3 py-2"
                >
                  <span className="font-medium text-[#172B4D]">
                    {p.code} · {p.name}
                  </span>
                  <StatusIndicator label={p.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Company Admin Configured RBAC Permissions */}
        <div className="lg:col-span-7 rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#2563EB]" />
            <h2 className="text-sm font-semibold text-[#172B4D]">
              Role Access & Governance Matrix (Configured by Company Admin)
            </h2>
          </div>
          <div className="divide-y divide-[#E2E8F0] text-xs">
            {profile.permissions.map((perm) => (
              <div key={perm.module} className="py-3 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-[#172B4D]">{perm.module}</span>
                  <StatusIndicator
                    label={perm.access}
                    tone={
                      perm.access === "Restricted by Admin"
                        ? "danger"
                        : perm.access === "Read Only"
                          ? "warning"
                          : "success"
                    }
                  />
                </div>
                <p className="text-[#64748B]">{perm.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { healthThresholds, updateHealthThresholds, resetDemoData } = usePMStore();
  const [form, setForm] = useState(healthThresholds);

  const handleSave = () => {
    updateHealthThresholds(form);
    toast.success("Configurable project health rule thresholds saved.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Overview", to: "/" }, { label: "Settings" }]}
        title="Workspace & Health Rule Settings"
        subtitle="Configure transparent project health evaluation thresholds and manage sample demonstration state."
        meta="Thresholds are configurable per company policy rather than hardcoded · Sample Data"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-4 text-xs">
          <h2 className="text-sm font-semibold text-[#172B4D]">
            Configurable Project Health Rules
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="font-medium text-[#172B4D]">
                Needs Attention Schedule Variance (%)
              </label>
              <input
                type="number"
                value={form.scheduleAttentionPercent}
                onChange={(e) =>
                  setForm({ ...form, scheduleAttentionPercent: Number(e.target.value) })
                }
                className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-3 font-mono"
              />
            </div>
            <div>
              <label className="font-medium text-[#172B4D]">
                Critical Schedule Variance (%)
              </label>
              <input
                type="number"
                value={form.scheduleCriticalPercent}
                onChange={(e) =>
                  setForm({ ...form, scheduleCriticalPercent: Number(e.target.value) })
                }
                className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-3 font-mono"
              />
            </div>
            <div>
              <label className="font-medium text-[#172B4D]">
                Budget Utilization Warning (%)
              </label>
              <input
                type="number"
                value={form.budgetWarningPercent}
                onChange={(e) =>
                  setForm({ ...form, budgetWarningPercent: Number(e.target.value) })
                }
                className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-3 font-mono"
              />
            </div>
            <div>
              <label className="font-medium text-[#172B4D]">
                Workforce Shortage Alert (%)
              </label>
              <input
                type="number"
                value={form.workforceShortageAlertPercent}
                onChange={(e) =>
                  setForm({
                    ...form,
                    workforceShortageAlertPercent: Number(e.target.value),
                  })
                }
                className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-3 font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave}>Save Thresholds</Button>
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-4 text-xs h-fit">
          <h2 className="text-sm font-semibold text-[#172B4D]">
            Demonstration Dataset Controls
          </h2>
          <p className="text-[#64748B]">
            This workspace runs on realistic Indian construction sample data structured for Supabase PostgreSQL, Row Level Security, and Cloudflare R2 storage integration. Resetting restores all milestones, DPR reviews, approvals, and issues to their initial baseline.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              resetDemoData();
              toast.success("Sample construction dataset restored to initial baseline.");
            }}
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Sample Data</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
