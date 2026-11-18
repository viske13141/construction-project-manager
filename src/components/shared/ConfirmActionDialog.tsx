import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant = "default",
  requireReason = true,
  reasonLabel = "Action Remarks / Business Reason",
  reasonPlaceholder = "Enter justification for audit trail...",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive" | "success" | "navy" | "amber";
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (requireReason && reason.trim().length < 5) {
      setError("Please provide at least 5 characters for the audit trail.");
      return;
    }
    onConfirm(reason.trim());
    setReason("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          setError("");
          setReason("");
        }
        onOpenChange(val);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {requireReason && (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[#172B4D]">
              {reasonLabel} <span className="text-[#DC2626]">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              placeholder={reasonPlaceholder}
              className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#172B4D] placeholder:text-[#64748B]/70 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
            {error && <p className="text-xs text-[#DC2626]">{error}</p>}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" variant={confirmVariant} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
