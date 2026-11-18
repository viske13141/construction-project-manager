import { useMemo, useState } from "react";
import { Eye, FileText, History, Lock, Plus, Search, ShieldCheck } from "lucide-react";
import { usePMStore } from "../../store/pmStore";
import { formatDate } from "../../lib/utils";
import { DocumentCategory, ProjectDocument } from "../../types/projectManager";
import { PageHeader } from "../../components/shared/PageHeader";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { toast } from "sonner";

export function ProjectDocumentsPage() {
  const { projects, documents, selectedProjectId, addDocument } = usePMStore();

  const [projectFilter, setProjectFilter] = useState(
    selectedProjectId === "ALL" ? "ALL" : selectedProjectId
  );
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);

  const [newProjectId, setNewProjectId] = useState(projects[0]?.id ?? "");
  const [newTitle, setNewTitle] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [newCategory, setNewCategory] = useState<DocumentCategory>(DocumentCategory.DRAWINGS);
  const [newScope, setNewScope] =
    useState<ProjectDocument["accessScope"]>("Assigned Project Team");
  const [newNotes, setNewNotes] = useState("");

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((d) => {
      if (projectFilter !== "ALL" && d.projectId !== projectFilter) return false;
      if (categoryFilter !== "All" && d.category !== categoryFilter) return false;
      if (
        q &&
        !d.title.toLowerCase().includes(q) &&
        !d.fileName.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [documents, projectFilter, categoryFilter, search]);

  const handleUpload = () => {
    if (newTitle.trim().length < 4 || newFileName.trim().length < 4) {
      toast.error("Provide a document title and file name.");
      return;
    }
    addDocument({
      projectId: newProjectId,
      title: newTitle.trim(),
      fileName: newFileName.trim(),
      category: newCategory,
      accessScope: newScope,
      notes: newNotes.trim(),
    });
    toast.success(`Uploaded "${newTitle.trim()}" to private R2-ready project vault.`);
    setNewTitle("");
    setNewFileName("");
    setNewNotes("");
    setUploadOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Overview", to: "/" }, { label: "Project Documents" }]}
        title="Project Document Repository"
        subtitle="Access contracts, structural drawings, BOQs, permits, safety reports, and site photographs with version history."
        meta="Storage Security: Files stored privately; downloads issue time-limited signed access URLs (Cloudflare R2 ready) · Sample Data"
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>Upload Document</span>
          </Button>
        }
      />

      {/* Search & Filters */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drawing title or filename..."
            className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] pl-9 pr-3 text-xs"
          />
        </div>
        <select
          aria-label="Filter documents by project"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs"
        >
          <option value="ALL">Project: All Assigned</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} · {p.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter documents by category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs"
        >
          <option value="All">Category: All (12 types)</option>
          {Object.values(DocumentCategory).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Document Table */}
      <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F5F7FA] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              <th className="py-3 px-4">Document & File</th>
              <th className="py-3 px-3">Project & Category</th>
              <th className="py-3 px-3">Version</th>
              <th className="py-3 px-3">Access Scope</th>
              <th className="py-3 px-3">Uploaded</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {filteredDocs.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-[#2563EB] shrink-0" />
                    <div>
                      <p className="font-semibold text-[#172B4D]">{d.title}</p>
                      <p className="font-mono text-[#64748B]">
                        {d.fileName} · {d.fileSize}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <p className="text-[#172B4D]">{d.projectName}</p>
                  <p className="text-[#64748B]">{d.category}</p>
                </td>
                <td className="py-3 px-3 font-mono font-semibold text-[#172B4D]">
                  {d.version}
                </td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1 text-[#64748B]">
                    <Lock className="h-3 w-3" /> {d.accessScope}
                  </span>
                </td>
                <td className="py-3 px-3 text-[#64748B] tabular-nums">
                  <p>{formatDate(d.uploadedDate)}</p>
                  <p>{d.uploadedBy}</p>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewDoc(d)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Preview & History</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Project Document</DialogTitle>
            <DialogDescription>
              Files are stored privately with assigned-project RBAC enforcement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-medium text-[#172B4D]">Assigned Project</label>
              <select
                value={newProjectId}
                onChange={(e) => setNewProjectId(e.target.value)}
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
              <label className="font-medium text-[#172B4D]">Document Title</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Foundation Permit Clearance"
                className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-3"
              />
            </div>
            <div>
              <label className="font-medium text-[#172B4D]">File Name</label>
              <input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="e.g., HYD-Permit-2026.pdf"
                className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-3 font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-[#172B4D]">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as DocumentCategory)}
                  className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-2.5"
                >
                  {Object.values(DocumentCategory).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-medium text-[#172B4D]">Access Scope</label>
                <select
                  value={newScope}
                  onChange={(e) =>
                    setNewScope(e.target.value as ProjectDocument["accessScope"])
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-2.5"
                >
                  <option value="Assigned Project Team">Assigned Project Team</option>
                  <option value="PM & Company Admin Only">PM & Company Admin Only</option>
                  <option value="Client Shared">Client Shared</option>
                </select>
              </div>
            </div>
            <div>
              <label className="font-medium text-[#172B4D]">Version Notes</label>
              <input
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Initial release notes..."
                className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-3"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setUploadOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload}>Upload Document</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview & Version History Dialog */}
      <Dialog open={Boolean(previewDoc)} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="max-w-lg">
          {previewDoc && (
            <>
              <DialogHeader>
                <DialogTitle>{previewDoc.title}</DialogTitle>
                <DialogDescription>
                  {previewDoc.fileName} · {previewDoc.projectName} · {previewDoc.category}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-xs">
                <div className="rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-[#172B4D]">
                    <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
                    <span>Protected Document Preview</span>
                  </div>
                  <p className="text-[#64748B]">
                    Access Scope: <strong>{previewDoc.accessScope}</strong>. Downloading generates a 15-minute signed URL scoped to your PM session.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="inline-flex items-center gap-1.5 font-semibold text-[#172B4D]">
                    <History className="h-3.5 w-3.5" /> Version History
                  </p>
                  {previewDoc.versionHistory.map((vh) => (
                    <div
                      key={vh.version}
                      className="rounded-lg border border-[#E2E8F0] p-2.5 space-y-0.5"
                    >
                      <p className="font-mono font-semibold text-[#172B4D]">
                        {vh.version} · {formatDate(vh.uploadedAt)} by {vh.uploadedBy}
                      </p>
                      <p className="text-[#64748B]">{vh.notes}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPreviewDoc(null)}>
                    Close
                  </Button>
                  <Button
                    onClick={() =>
                      toast.success(
                        `Generated time-limited signed URL (15m expiry) for ${previewDoc.fileName}.`
                      )
                    }
                  >
                    Download via Signed Link
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
