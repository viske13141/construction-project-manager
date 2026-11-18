import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Bell, CheckCheck } from "lucide-react";
import { usePMStore } from "../../store/pmStore";
import { cn, formatRelativeTime } from "../../lib/utils";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatusIndicator } from "../../components/shared/StatusIndicator";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

export function NotificationsPage() {
  const navigate = useNavigate();
  const {
    notifications,
    notificationPrefs,
    markNotificationRead,
    markAllNotificationsRead,
    updateNotificationPrefs,
  } = usePMStore();

  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = useMemo(
    () =>
      notifications.filter((n) => (filter === "unread" ? !n.read : true)),
    [notifications, filter]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Overview", to: "/" }, { label: "Notifications" }]}
        title="Notifications & Escalation Alerts"
        subtitle="Stay ahead of milestone slips, daily report submissions, budget threshold warnings, and site safety issues."
        meta={`${unreadCount} unread alerts across your assigned projects · Sample Data`}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              markAllNotificationsRead();
              toast.success("All notifications marked as read.");
            }}
          >
            <CheckCheck className="h-4 w-4" />
            <span>Mark All Read</span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8 space-y-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer",
                filter === "all"
                  ? "bg-[#101F35] text-white"
                  : "bg-white border border-[#E2E8F0] text-[#64748B]"
              )}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer",
                filter === "unread"
                  ? "bg-[#101F35] text-white"
                  : "bg-white border border-[#E2E8F0] text-[#64748B]"
              )}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <div className="divide-y divide-[#E2E8F0] rounded-xl border border-[#E2E8F0] bg-white">
            {filtered.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between",
                  !n.read && "bg-[#2563EB]/[0.03]"
                )}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <StatusIndicator
                      label={n.category}
                      tone={
                        n.severity === "critical"
                          ? "danger"
                          : n.severity === "warning"
                            ? "warning"
                            : "info"
                      }
                    />
                    <span className="text-[#64748B]">{n.projectName}</span>
                    <span className="text-[#64748B] tabular-nums">
                      · {formatRelativeTime(n.timestamp)}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#172B4D]">{n.title}</h3>
                  <p className="text-xs text-[#64748B]">{n.message}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!n.read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markNotificationRead(n.id)}
                    >
                      Mark Read
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      markNotificationRead(n.id);
                      navigate(n.targetRoute);
                    }}
                  >
                    <span>Open Record</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="xl:col-span-4 rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-4 h-fit">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#2563EB]" />
            <h2 className="text-sm font-semibold text-[#172B4D]">
              Notification Preferences
            </h2>
          </div>
          <div className="space-y-3 text-xs">
            {(
              [
                ["milestoneDelays", "Milestone Delay Alerts"],
                ["budgetAlerts", "Budget Utilization Thresholds"],
                ["dailyReports", "Daily Progress Report Submissions"],
                ["safetyCritical", "Critical Safety & Breakdown Issues"],
                ["approvalQueue", "Pending Approval Queue Reminders"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center justify-between gap-2 rounded-lg border border-[#E2E8F0] p-3 cursor-pointer"
              >
                <span className="font-medium text-[#172B4D]">{label}</span>
                <input
                  type="checkbox"
                  checked={notificationPrefs[key]}
                  onChange={(e) => {
                    updateNotificationPrefs({
                      ...notificationPrefs,
                      [key]: e.target.checked,
                    });
                    toast.success("Notification preference saved.");
                  }}
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
