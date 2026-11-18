import React from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  meta,
}: {
  title: string;
  subtitle: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  meta?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-[#E2E8F0] pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs text-[#64748B]"
          >
            {breadcrumbs.map((crumb, idx) => (
              <span key={`${crumb.label}-${idx}`} className="inline-flex items-center gap-1.5">
                {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-400" />}
                {crumb.to ? (
                  <Link to={crumb.to} className="hover:text-[#172B4D] transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-[#172B4D]">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-[#172B4D] text-balance">
          {title}
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">{subtitle}</p>
        {meta && (
          <p className="mt-2 text-xs text-[#64748B] tabular-nums">{meta}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>
      )}
    </div>
  );
}
