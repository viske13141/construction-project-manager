import { create } from "zustand";
import {
  INITIAL_ACTIVITY_LOGS,
  INITIAL_APPROVALS,
  INITIAL_BUDGET_BREAKDOWNS,
  INITIAL_COST_RECORDS,
  INITIAL_DOCUMENTS,
  INITIAL_DPRS,
  INITIAL_EQUIPMENT,
  INITIAL_ISSUES,
  INITIAL_MATERIAL_REQUESTS,
  INITIAL_MILESTONES,
  INITIAL_NOTIFICATIONS,
  INITIAL_PROJECTS,
  INITIAL_RISKS,
  INITIAL_SHORTAGE_ALERTS,
  INITIAL_SITES,
  INITIAL_TASKS,
  INITIAL_WORKFORCE,
  SAMPLE_PM_PROFILE,
} from "../data/mockProjectManagerData";
import {
  ActivityLogEntry,
  ApprovalCategory,
  ApprovalItem,
  ApprovalStatus,
  BudgetCategoryBreakdown,
  DailyProgressReport,
  DocumentCategory,
  EquipmentAsset,
  IssueCategory,
  IssueStatus,
  MaterialRequest,
  MilestoneStatus,
  PMProfile,
  PriorityLevel,
  Project,
  ProjectCostRecord,
  ProjectDocument,
  ProjectIssue,
  ProjectMilestone,
  ProjectNotification,
  ProjectRisk,
  ProjectSite,
  ProjectTask,
  TaskStatus,
  WorkforceMember,
  WorkforceShortageAlert,
} from "../types/projectManager";

export type DateRangePreset = "7d" | "30d" | "90d" | "all";

interface HealthThresholdSettings {
  scheduleAttentionPercent: number;
  scheduleCriticalPercent: number;
  budgetWarningPercent: number;
  workforceShortageAlertPercent: number;
}

interface PMStoreState {
  profile: PMProfile;
  selectedProjectId: string; // "ALL" or project id
  recentProjectIds: string[];
  dateRange: DateRangePreset;
  projects: Project[];
  sites: ProjectSite[];
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
  workforce: WorkforceMember[];
  shortageAlerts: WorkforceShortageAlert[];
  budgetBreakdowns: BudgetCategoryBreakdown[];
  costRecords: ProjectCostRecord[];
  materialRequests: MaterialRequest[];
  equipment: EquipmentAsset[];
  issues: ProjectIssue[];
  risks: ProjectRisk[];
  dailyReports: DailyProgressReport[];
  approvals: ApprovalItem[];
  documents: ProjectDocument[];
  notifications: ProjectNotification[];
  activityLogs: ActivityLogEntry[];
  healthThresholds: HealthThresholdSettings;
  notificationPrefs: {
    milestoneDelays: boolean;
    budgetAlerts: boolean;
    dailyReports: boolean;
    safetyCritical: boolean;
    approvalQueue: boolean;
  };

  setSelectedProjectId: (id: string) => void;
  setDateRange: (range: DateRangePreset) => void;
  addMilestone: (input: {
    projectId: string;
    siteId: string;
    phase: string;
    name: string;
    description: string;
    originalPlannedDate: string;
    responsiblePerson: string;
    assignedTeam: string;
  }) => void;
  updateMilestone: (
    milestoneId: string,
    updates: {
      revisedDate?: string;
      completionPercent?: number;
      status?: MilestoneStatus;
      reason?: string;
    }
  ) => void;
  reassignTask: (taskId: string, responsiblePerson: string, status: TaskStatus, progress: number) => void;
  submitManpowerRequest: (shortageId: string, note: string) => void;
  verifyMaterialReceipt: (requestId: string, receivedQty: number) => void;
  approveMaterialRequest: (requestId: string) => void;
  requestEquipmentTransfer: (equipmentId: string, targetSiteName: string, reason: string) => void;
  createIssue: (input: {
    projectId: string;
    siteId: string;
    title: string;
    description: string;
    category: IssueCategory;
    priority: PriorityLevel;
    assignedTo: string;
    dueDate: string;
  }) => void;
  updateIssueStatus: (
    issueId: string,
    status: IssueStatus,
    remarks: string,
    escalateToAdmin?: boolean
  ) => void;
  reviewDailyReport: (
    reportId: string,
    action: "Reviewed" | "Correction Requested",
    comment: string
  ) => void;
  decideApproval: (
    approvalId: string,
    decision: ApprovalStatus,
    remarks: string
  ) => { ok: boolean; error?: string };
  addDocument: (input: {
    projectId: string;
    title: string;
    fileName: string;
    category: DocumentCategory;
    accessScope: ProjectDocument["accessScope"];
    notes: string;
  }) => void;
  submitBudgetRevision: (projectId: string, additionalAmountInr: number, reason: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateHealthThresholds: (next: HealthThresholdSettings) => void;
  updateNotificationPrefs: (next: PMStoreState["notificationPrefs"]) => void;
  resetDemoData: () => void;
}

const nowIso = () => new Date().toISOString();

export const usePMStore = create<PMStoreState>((set, get) => ({
  profile: SAMPLE_PM_PROFILE,
  selectedProjectId: "ALL",
  recentProjectIds: ["prj-001", "prj-002", "prj-003"],
  dateRange: "30d",
  projects: INITIAL_PROJECTS,
  sites: INITIAL_SITES,
  milestones: INITIAL_MILESTONES,
  tasks: INITIAL_TASKS,
  workforce: INITIAL_WORKFORCE,
  shortageAlerts: INITIAL_SHORTAGE_ALERTS,
  budgetBreakdowns: INITIAL_BUDGET_BREAKDOWNS,
  costRecords: INITIAL_COST_RECORDS,
  materialRequests: INITIAL_MATERIAL_REQUESTS,
  equipment: INITIAL_EQUIPMENT,
  issues: INITIAL_ISSUES,
  risks: INITIAL_RISKS,
  dailyReports: INITIAL_DPRS,
  approvals: INITIAL_APPROVALS,
  documents: INITIAL_DOCUMENTS,
  notifications: INITIAL_NOTIFICATIONS,
  activityLogs: INITIAL_ACTIVITY_LOGS,
  healthThresholds: {
    scheduleAttentionPercent: -3,
    scheduleCriticalPercent: -7,
    budgetWarningPercent: 85,
    workforceShortageAlertPercent: 5,
  },
  notificationPrefs: {
    milestoneDelays: true,
    budgetAlerts: true,
    dailyReports: true,
    safetyCritical: true,
    approvalQueue: true,
  },

  setSelectedProjectId: (id) =>
    set((state) => ({
      selectedProjectId: id,
      recentProjectIds:
        id === "ALL"
          ? state.recentProjectIds
          : [id, ...state.recentProjectIds.filter((r) => r !== id)].slice(0, 4),
    })),

  setDateRange: (range) => set({ dateRange: range }),

  addMilestone: (input) =>
    set((state) => {
      const project = state.projects.find((p) => p.id === input.projectId);
      const site = state.sites.find((s) => s.id === input.siteId);
      const newMs: ProjectMilestone = {
        id: `ms-${Date.now()}`,
        organizationId: "org-deccan-01",
        projectId: input.projectId,
        projectName: project?.name ?? "Assigned Project",
        siteId: input.siteId,
        siteName: site?.name ?? "Site",
        phase: input.phase,
        name: input.name,
        description: input.description,
        originalPlannedDate: input.originalPlannedDate,
        responsiblePerson: input.responsiblePerson,
        assignedTeam: input.assignedTeam,
        completionPercent: 0,
        status: MilestoneStatus.UPCOMING,
        dependencies: [],
        revisionHistory: [],
        hasSupportingDocs: false,
      };
      const log: ActivityLogEntry = {
        id: `act-${Date.now()}`,
        projectId: input.projectId,
        projectName: project?.name ?? "Project",
        siteName: site?.name ?? "Site",
        user: state.profile.name,
        userRole: "Project Manager",
        action: `Created baseline milestone "${input.name}" (Target: ${input.originalPlannedDate})`,
        category: "Milestone",
        timestamp: nowIso(),
        statusLabel: "Upcoming",
      };
      return {
        milestones: [newMs, ...state.milestones],
        activityLogs: [log, ...state.activityLogs],
      };
    }),

  updateMilestone: (milestoneId, updates) =>
    set((state) => {
      const target = state.milestones.find((m) => m.id === milestoneId);
      if (!target) return state;

      const updatedMilestones = state.milestones.map((m) => {
        if (m.id !== milestoneId) return m;
        const revHistory = [...m.revisionHistory];
        if (updates.revisedDate && updates.revisedDate !== (m.revisedDate || m.originalPlannedDate)) {
          revHistory.unshift({
            date: new Date().toISOString().slice(0, 10),
            previousDate: m.revisedDate || m.originalPlannedDate,
            newDate: updates.revisedDate,
            reason: updates.reason || "Schedule adjustment by Project Manager",
            updatedBy: state.profile.name,
          });
        }
        return {
          ...m,
          revisedDate: updates.revisedDate ?? m.revisedDate,
          completionPercent: updates.completionPercent ?? m.completionPercent,
          status: updates.status ?? m.status,
          actualCompletionDate:
            updates.status === MilestoneStatus.COMPLETED
              ? new Date().toISOString().slice(0, 10)
              : m.actualCompletionDate,
          revisionHistory: revHistory,
        };
      });

      const log: ActivityLogEntry = {
        id: `act-${Date.now()}`,
        projectId: target.projectId,
        projectName: target.projectName,
        siteName: target.siteName,
        user: state.profile.name,
        userRole: "Project Manager",
        action: `Updated milestone "${target.name}" (${updates.status ?? target.status}, ${updates.completionPercent ?? target.completionPercent}%)`,
        category: "Milestone",
        timestamp: nowIso(),
        statusLabel: updates.status ?? target.status,
      };

      return {
        milestones: updatedMilestones,
        activityLogs: [log, ...state.activityLogs],
      };
    }),

  reassignTask: (taskId, responsiblePerson, status, progress) =>
    set((state) => {
      const target = state.tasks.find((t) => t.id === taskId);
      if (!target) return state;
      return {
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                responsiblePerson,
                status,
                progress,
                actualEnd: status === TaskStatus.COMPLETED ? new Date().toISOString().slice(0, 10) : t.actualEnd,
              }
            : t
        ),
        activityLogs: [
          {
            id: `act-${Date.now()}`,
            projectId: target.projectId,
            projectName: target.projectName,
            siteName: target.siteName,
            user: state.profile.name,
            userRole: "Project Manager",
            action: `Updated task "${target.name}" -> Assigned: ${responsiblePerson}, ${status} (${progress}%)`,
            category: "Milestone",
            timestamp: nowIso(),
            statusLabel: status,
          },
          ...state.activityLogs,
        ],
      };
    }),

  submitManpowerRequest: (shortageId, note) =>
    set((state) => {
      const target = state.shortageAlerts.find((s) => s.id === shortageId);
      if (!target) return state;
      const ref = `HR-MAN-2026-${Math.floor(100 + Math.random() * 899)}`;
      return {
        shortageAlerts: state.shortageAlerts.map((s) =>
          s.id === shortageId ? { ...s, requestSubmitted: true, requestRef: ref } : s
        ),
        activityLogs: [
          {
            id: `act-${Date.now()}`,
            projectId: target.projectId,
            projectName: target.projectName,
            siteName: target.siteName,
            user: state.profile.name,
            userRole: "Project Manager",
            action: `Submitted manpower requisition ${ref} for ${target.shortageCount} ${target.designation} (${note})`,
            category: "Workforce",
            timestamp: nowIso(),
            statusLabel: "Sent to HR / Admin",
          },
          ...state.activityLogs,
        ],
      };
    }),

  verifyMaterialReceipt: (requestId, receivedQty) =>
    set((state) => {
      const target = state.materialRequests.find((m) => m.id === requestId);
      if (!target) return state;
      return {
        materialRequests: state.materialRequests.map((m) =>
          m.id === requestId
            ? {
                ...m,
                deliveryStatus: "Receipt Verified",
                verifiedReceiptQty: receivedQty,
                currentSiteStock: Number((m.currentSiteStock + receivedQty).toFixed(1)),
              }
            : m
        ),
        activityLogs: [
          {
            id: `act-${Date.now()}`,
            projectId: target.projectId,
            projectName: target.projectName,
            siteName: target.siteName,
            user: state.profile.name,
            userRole: "Project Manager",
            action: `Verified material receipt for ${target.requestNumber}: ${receivedQty} ${target.unit} ${target.materialName}`,
            category: "Material",
            timestamp: nowIso(),
            statusLabel: "Receipt Verified",
          },
          ...state.activityLogs,
        ],
      };
    }),

  approveMaterialRequest: (requestId) =>
    set((state) => {
      const target = state.materialRequests.find((m) => m.id === requestId);
      if (!target) return state;
      const withinLimit = target.estimatedCostInr <= state.profile.approvalAuthorityLimitInr;
      const nextApprovalStatus = withinLimit ? "Approved" : "Escalated to Admin";
      const nextDelivery = withinLimit ? "PO Issued" : target.deliveryStatus;
      return {
        materialRequests: state.materialRequests.map((m) =>
          m.id === requestId
            ? {
                ...m,
                approvalStatus: nextApprovalStatus,
                deliveryStatus: nextDelivery,
                poNumber: withinLimit ? m.poNumber ?? `PO-${Date.now().toString().slice(-4)}` : m.poNumber,
              }
            : m
        ),
        activityLogs: [
          {
            id: `act-${Date.now()}`,
            projectId: target.projectId,
            projectName: target.projectName,
            siteName: target.siteName,
            user: state.profile.name,
            userRole: "Project Manager",
            action: withinLimit
              ? `Approved material request ${target.requestNumber} (PO authorized, awaiting delivery receipt)`
              : `Escalated ${target.requestNumber} to Company Admin (exceeds ₹5L limit)`,
            category: "Material",
            timestamp: nowIso(),
            statusLabel: nextApprovalStatus,
          },
          ...state.activityLogs,
        ],
      };
    }),

  requestEquipmentTransfer: (equipmentId, targetSiteName, reason) =>
    set((state) => {
      const eq = state.equipment.find((e) => e.id === equipmentId);
      if (!eq) return state;
      return {
        equipment: state.equipment.map((e) =>
          e.id === equipmentId ? { ...e, reassignmentRequestedTo: targetSiteName } : e
        ),
        activityLogs: [
          {
            id: `act-${Date.now()}`,
            projectId: eq.projectId,
            projectName: eq.projectName,
            siteName: eq.siteName,
            user: state.profile.name,
            userRole: "Project Manager",
            action: `Requested reassignment of ${eq.equipmentCode} (${eq.name}) to ${targetSiteName}: ${reason}`,
            category: "Approval",
            timestamp: nowIso(),
            statusLabel: "Transfer Requested",
          },
          ...state.activityLogs,
        ],
      };
    }),

  createIssue: (input) =>
    set((state) => {
      const project = state.projects.find((p) => p.id === input.projectId);
      const site = state.sites.find((s) => s.id === input.siteId);
      const code = `ISS-${project?.code.slice(-3) ?? "PRJ"}-${Math.floor(100 + Math.random() * 899)}`;
      const newIssue: ProjectIssue = {
        id: `iss-${Date.now()}`,
        organizationId: "org-deccan-01",
        issueCode: code,
        title: input.title,
        description: input.description,
        category: input.category,
        projectId: input.projectId,
        projectName: project?.name ?? "Project",
        siteId: input.siteId,
        siteName: site?.name ?? "Site",
        reportedBy: state.profile.name,
        assignedTo: input.assignedTo,
        priority: input.priority,
        severity: input.priority === PriorityLevel.CRITICAL ? "Critical" : input.priority === PriorityLevel.HIGH ? "High" : "Moderate",
        reportedDate: new Date().toISOString().slice(0, 10),
        dueDate: input.dueDate,
        status: IssueStatus.ASSIGNED,
        hasPhotoEvidence: false,
        escalatedToAdmin: false,
        history: [
          {
            timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
            actor: state.profile.name,
            note: `Logged issue and assigned to ${input.assignedTo}.`,
          },
        ],
      };
      return {
        issues: [newIssue, ...state.issues],
        activityLogs: [
          {
            id: `act-${Date.now()}`,
            projectId: input.projectId,
            projectName: project?.name ?? "Project",
            siteName: site?.name ?? "Site",
            user: state.profile.name,
            userRole: "Project Manager",
            action: `Logged ${code}: "${input.title}" (${input.priority})`,
            category: "Issue",
            timestamp: nowIso(),
            statusLabel: "Assigned",
          },
          ...state.activityLogs,
        ],
      };
    }),

  updateIssueStatus: (issueId, status, remarks, escalateToAdmin) =>
    set((state) => {
      const target = state.issues.find((i) => i.id === issueId);
      if (!target) return state;
      return {
        issues: state.issues.map((i) =>
          i.id === issueId
            ? {
                ...i,
                status,
                resolutionRemarks: remarks || i.resolutionRemarks,
                escalatedToAdmin: escalateToAdmin ?? i.escalatedToAdmin,
                history: [
                  {
                    timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
                    actor: state.profile.name,
                    note: `${status}: ${remarks}`,
                  },
                  ...i.history,
                ],
              }
            : i
        ),
        activityLogs: [
          {
            id: `act-${Date.now()}`,
            projectId: target.projectId,
            projectName: target.projectName,
            siteName: target.siteName,
            user: state.profile.name,
            userRole: "Project Manager",
            action: `Updated ${target.issueCode} to ${status}${escalateToAdmin ? " (Escalated to Company Admin)" : ""}: ${remarks}`,
            category: "Issue",
            timestamp: nowIso(),
            statusLabel: status,
          },
          ...state.activityLogs,
        ],
      };
    }),

  reviewDailyReport: (reportId, action, comment) =>
    set((state) => {
      const target = state.dailyReports.find((d) => d.id === reportId);
      if (!target) return state;
      return {
        dailyReports: state.dailyReports.map((d) =>
          d.id === reportId
            ? {
                ...d,
                reviewStatus: action,
                pmComments: comment,
                revisions: [
                  ...d.revisions,
                  {
                    version: d.revisions.length + 1,
                    submittedAt: nowIso(),
                    submittedBy: state.profile.name,
                    summary: `PM Review Action: ${action}`,
                    pmActionNote: comment,
                  },
                ],
              }
            : d
        ),
        activityLogs: [
          {
            id: `act-${Date.now()}`,
            projectId: target.projectId,
            projectName: target.projectName,
            siteName: target.siteName,
            user: state.profile.name,
            userRole: "Project Manager",
            action: `Marked ${target.reportCode} as "${action}" — ${comment}`,
            category: "Daily Report",
            timestamp: nowIso(),
            statusLabel: action,
          },
          ...state.activityLogs,
        ],
      };
    }),

  decideApproval: (approvalId, decision, remarks) => {
    const state = get();
    const item = state.approvals.find((a) => a.id === approvalId);
    if (!item) return { ok: false, error: "Approval record not found." };

    // Maker-checker rule: cannot approve own submission
    if (
      decision === ApprovalStatus.APPROVED &&
      item.submittedBy.toLowerCase().includes(state.profile.name.toLowerCase())
    ) {
      return {
        ok: false,
        error: "Maker-checker violation: You cannot approve a request you submitted yourself.",
      };
    }

    // Authority limit rule
    if (
      decision === ApprovalStatus.APPROVED &&
      item.amountInr !== null &&
      item.amountInr > state.profile.approvalAuthorityLimitInr
    ) {
      return {
        ok: false,
        error: `Amount exceeds your ₹5,00,000 PM approval authority limit. Please escalate to Company Admin.`,
      };
    }

    if (
      (decision === ApprovalStatus.REJECTED || decision === ApprovalStatus.CHANGES_REQUESTED) &&
      remarks.trim().length < 5
    ) {
      return {
        ok: false,
        error: "Remarks are mandatory when rejecting or requesting changes.",
      };
    }

    set((curr) => ({
      approvals: curr.approvals.map((a) =>
        a.id === approvalId
          ? {
              ...a,
              status: decision,
              decisionRemarks: remarks,
              decidedBy: curr.profile.name,
              decidedAt: nowIso(),
              previousHistory: [
                ...a.previousHistory,
                `${decision} by ${curr.profile.name}: ${remarks}`,
              ],
            }
          : a
      ),
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          projectId: item.projectId,
          projectName: item.projectName,
          siteName: item.siteName,
          user: curr.profile.name,
          userRole: "Project Manager",
          action: `${decision} ${item.requestNumber} (${item.title}) — ${remarks}`,
          category: "Approval",
          timestamp: nowIso(),
          statusLabel: decision,
        },
        ...curr.activityLogs,
      ],
    }));

    return { ok: true };
  },

  addDocument: (input) =>
    set((state) => {
      const project = state.projects.find((p) => p.id === input.projectId);
      const newDoc: ProjectDocument = {
        id: `doc-${Date.now()}`,
        organizationId: "org-deccan-01",
        projectId: input.projectId,
        projectName: project?.name ?? "Project",
        title: input.title,
        fileName: input.fileName,
        category: input.category,
        version: "v1.0",
        fileSize: "1.8 MB",
        uploadedDate: new Date().toISOString().slice(0, 10),
        uploadedBy: state.profile.name,
        accessScope: input.accessScope,
        versionHistory: [
          {
            version: "v1.0",
            uploadedAt: new Date().toISOString().slice(0, 10),
            uploadedBy: state.profile.name,
            notes: input.notes || "Initial document upload",
          },
        ],
      };
      return {
        documents: [newDoc, ...state.documents],
        activityLogs: [
          {
            id: `act-${Date.now()}`,
            projectId: input.projectId,
            projectName: project?.name ?? "Project",
            siteName: "Project Repository",
            user: state.profile.name,
            userRole: "Project Manager",
            action: `Uploaded "${input.title}" (${input.category})`,
            category: "Document",
            timestamp: nowIso(),
            statusLabel: "Uploaded",
          },
          ...state.activityLogs,
        ],
      };
    }),

  submitBudgetRevision: (projectId, additionalAmountInr, reason) =>
    set((state) => {
      const project = state.projects.find((p) => p.id === projectId);
      if (!project) return state;
      const newApr: ApprovalItem = {
        id: `apr-${Date.now()}`,
        organizationId: "org-deccan-01",
        requestNumber: `APR-2026-${Math.floor(500 + Math.random() * 499)}`,
        category: ApprovalCategory.BUDGET_REVISION,
        projectId,
        projectName: project.name,
        siteName: "All Project Sites",
        title: `Budget Revision Request (+₹${(additionalAmountInr / 100000).toFixed(2)} L)`,
        description: reason,
        submittedBy: state.profile.name,
        submittedDate: new Date().toISOString().slice(0, 10),
        amountInr: additionalAmountInr,
        withinPmAuthority: false,
        pmAuthorityLimitInr: state.profile.approvalAuthorityLimitInr,
        supportingDocs: ["Cost-Variance-Summary.pdf"],
        previousHistory: ["Submitted by PM Arjun Deshmukh; routed to Company Admin / Finance"],
        status: ApprovalStatus.ESCALATED,
      };
      return {
        approvals: [newApr, ...state.approvals],
        activityLogs: [
          {
            id: `act-${Date.now()}`,
            projectId,
            projectName: project.name,
            siteName: "Budget Control",
            user: state.profile.name,
            userRole: "Project Manager",
            action: `Submitted budget revision request ${newApr.requestNumber} (+₹${(additionalAmountInr / 100000).toFixed(2)} L): ${reason}`,
            category: "Budget",
            timestamp: nowIso(),
            statusLabel: "Escalated",
          },
          ...state.activityLogs,
        ],
      };
    }),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  updateHealthThresholds: (next) => set({ healthThresholds: next }),

  updateNotificationPrefs: (next) => set({ notificationPrefs: next }),

  resetDemoData: () =>
    set({
      selectedProjectId: "ALL",
      dateRange: "30d",
      projects: INITIAL_PROJECTS,
      sites: INITIAL_SITES,
      milestones: INITIAL_MILESTONES,
      tasks: INITIAL_TASKS,
      workforce: INITIAL_WORKFORCE,
      shortageAlerts: INITIAL_SHORTAGE_ALERTS,
      budgetBreakdowns: INITIAL_BUDGET_BREAKDOWNS,
      costRecords: INITIAL_COST_RECORDS,
      materialRequests: INITIAL_MATERIAL_REQUESTS,
      equipment: INITIAL_EQUIPMENT,
      issues: INITIAL_ISSUES,
      risks: INITIAL_RISKS,
      dailyReports: INITIAL_DPRS,
      approvals: INITIAL_APPROVALS,
      documents: INITIAL_DOCUMENTS,
      notifications: INITIAL_NOTIFICATIONS,
      activityLogs: INITIAL_ACTIVITY_LOGS,
    }),
}));
