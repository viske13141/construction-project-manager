import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PauseCircle,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "purple" | "neutral";

const STATUS_TONE_MAP: Record<string, Tone> = {
  "On Track": "success",
  Healthy: "success",
  Completed: "success",
  Approved: "success",
  Reviewed: "success",
  "Receipt Verified": "success",
  "Up to Date": "success",
  Operational: "success",
  Present: "success",
  Adequate: "success",
  Active: "info",
  "In Progress": "info",
  "In Use": "info",
  "PO Issued": "info",
  "In Transit": "info",
  Assigned: "info",
  "Needs Attention": "warning",
  "At Risk": "warning",
  "Pending Review": "warning",
  "Pending PM": "warning",
  Pending: "warning",
  "Due Soon": "warning",
  "Maintenance Due": "warning",
  "Low Stock": "warning",
  "Changes Requested": "warning",
  "Correction Requested": "warning",
  "On Leave": "warning",
  Idle: "neutral",
  Upcoming: "neutral",
  "Not Started": "neutral",
  "Not Ordered": "neutral",
  Planning: "neutral",
  "On Hold": "neutral",
  Delayed: "danger",
  Critical: "danger",
  Blocked: "danger",
  Breakdown: "danger",
  Overdue: "danger",
  "Critical Shortage": "danger",
  "Shortage Flagged": "danger",
  Rejected: "danger",
  Absent: "danger",
  "Under Maintenance": "warning",
  Escalated: "purple",
  "Escalated to Admin": "purple",
  High: "warning",
  Medium: "info",
  Low: "neutral",
};

const TONE_STYLES: Record<Tone, string> = {
  success: "text-[#16A34A] bg-[#16A34A]/8 border-[#16A34A]/20",
  warning: "text-[#B45309] bg-[#F59E0B]/10 border-[#F59E0B]/25",
  danger: "text-[#DC2626] bg-[#DC2626]/8 border-[#DC2626]/20",
  info: "text-[#2563EB] bg-[#2563EB]/8 border-[#2563EB]/20",
  purple: "text-[#7C3AED] bg-[#7C3AED]/8 border-[#7C3AED]/20",
  neutral: "text-[#64748B] bg-slate-100 border-[#E2E8F0]",
};

function getToneIcon(tone: Tone) {
  switch (tone) {
    case "success":
      return <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />;
    case "warning":
      return <AlertTriangle className="h-3.5 w-3.5 shrink-0" />;
    case "danger":
      return <XCircle className="h-3.5 w-3.5 shrink-0" />;
    case "purple":
      return <ShieldAlert className="h-3.5 w-3.5 shrink-0" />;
    case "info":
      return <Clock className="h-3.5 w-3.5 shrink-0" />;
    default:
      return <PauseCircle className="h-3.5 w-3.5 shrink-0" />;
  }
}

export function StatusIndicator({
  label,
  tone,
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  const resolvedTone = tone ?? STATUS_TONE_MAP[label] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0",
        TONE_STYLES[resolvedTone],
        className
      )}
    >
      {getToneIcon(resolvedTone)}
      <span>{label}</span>
    </span>
  );
}

export function InlineAlertCallout({
  title,
  description,
  tone = "warning",
}: {
  title: string;
  description: string;
  tone?: "warning" | "danger" | "info";
}) {
  const styles =
    tone === "danger"
      ? "border-[#DC2626]/30 bg-[#DC2626]/5 text-[#991B1B]"
      : tone === "info"
        ? "border-[#2563EB]/25 bg-[#2563EB]/5 text-[#1E40AF]"
        : "border-[#F59E0B]/35 bg-[#F59E0B]/8 text-[#92400E]";

  return (
    <div className={cn("flex items-start gap-3 rounded-lg border px-4 py-3 text-sm", styles)}>
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold text-[#172B4D]">{title}</p>
        <p className="mt-0.5 text-xs text-[#64748B]">{description}</p>
      </div>
    </div>
  );
}
