import React from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "../ui/button";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E2E8F0] bg-white px-6 py-12 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-[#64748B]">
        <FolderOpen className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-[#172B4D]">{title}</h3>
      <p className="mt-1 max-w-md text-xs text-[#64748B]">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" variant="outline" className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
