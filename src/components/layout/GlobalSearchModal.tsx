import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
  ClipboardCheck,
  FileText,
  FolderKanban,
  Search,
} from "lucide-react";
import { Dialog, DialogContent } from "../ui/dialog";
import { usePMStore } from "../../store/pmStore";

interface SearchHit {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  route: string;
  icon: "project" | "site" | "issue" | "approval" | "document";
}

export function GlobalSearchModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { projects, sites, issues, approvals, documents } = usePMStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const results = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase();
    const hits: SearchHit[] = [];

    projects.forEach((p) => {
      if (
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
      ) {
        hits.push({
          id: p.id,
          title: `${p.code} — ${p.name}`,
          subtitle: `${p.location} · ${p.status}`,
          category: "Assigned Project",
          route: `/projects/${p.id}`,
          icon: "project",
        });
      }
    });

    sites.forEach((s) => {
      if (
        q &&
        (s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.siteManager.toLowerCase().includes(q))
      ) {
        hits.push({
          id: s.id,
          title: `${s.code} — ${s.name}`,
          subtitle: `Site Manager: ${s.siteManager}`,
          category: "Site",
          route: "/sites",
          icon: "site",
        });
      }
    });

    issues.forEach((i) => {
      if (
        !q ||
        i.title.toLowerCase().includes(q) ||
        i.issueCode.toLowerCase().includes(q)
      ) {
        hits.push({
          id: i.id,
          title: `${i.issueCode} — ${i.title}`,
          subtitle: `${i.projectName} · ${i.status}`,
          category: "Issue",
          route: "/issues",
          icon: "issue",
        });
      }
    });

    approvals.forEach((a) => {
      if (
        q &&
        (a.title.toLowerCase().includes(q) ||
          a.requestNumber.toLowerCase().includes(q))
      ) {
        hits.push({
          id: a.id,
          title: `${a.requestNumber} — ${a.title}`,
          subtitle: `${a.projectName} · ${a.status}`,
          category: "Approval",
          route: "/approvals",
          icon: "approval",
        });
      }
    });

    documents.forEach((d) => {
      if (
        q &&
        (d.title.toLowerCase().includes(q) || d.fileName.toLowerCase().includes(q))
      ) {
        hits.push({
          id: d.id,
          title: d.title,
          subtitle: `${d.projectName} · ${d.version}`,
          category: "Document",
          route: "/documents",
          icon: "document",
        });
      }
    });

    return hits.slice(0, 12);
  }, [query, projects, sites, issues, approvals, documents]);

  const renderIcon = (icon: SearchHit["icon"]) => {
    switch (icon) {
      case "project":
        return <FolderKanban className="h-4 w-4 text-[#2563EB]" />;
      case "site":
        return <Building2 className="h-4 w-4 text-[#16A34A]" />;
      case "issue":
        return <AlertTriangle className="h-4 w-4 text-[#DC2626]" />;
      case "approval":
        return <ClipboardCheck className="h-4 w-4 text-[#F59E0B]" />;
      default:
        return <FileText className="h-4 w-4 text-[#64748B]" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <div className="flex items-center border-b border-[#E2E8F0] px-4 py-3">
          <Search className="mr-3 h-4 w-4 text-[#64748B]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assigned projects, sites, issues, approvals, documents..."
            className="w-full bg-transparent text-sm text-[#172B4D] placeholder:text-[#64748B] focus:outline-none"
          />
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-[#E2E8F0]">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#64748B]">
              No matching records found within your assigned project scope.
            </div>
          ) : (
            results.map((hit) => (
              <button
                key={`${hit.category}-${hit.id}`}
                type="button"
                onClick={() => {
                  navigate(hit.route);
                  onOpenChange(false);
                  setQuery("");
                }}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#E2E8F0] bg-[#F5F7FA]">
                    {renderIcon(hit.icon)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#172B4D]">
                      {hit.title}
                    </p>
                    <p className="truncate text-xs text-[#64748B]">{hit.subtitle}</p>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-medium text-[#64748B]">
                  {hit.category}
                </span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
