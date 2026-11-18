export enum ProjectStatus {
  PLANNING = "Planning",
  NOT_STARTED = "Not Started",
  ACTIVE = "Active",
  ON_TRACK = "On Track",
  AT_RISK = "At Risk",
  DELAYED = "Delayed",
  ON_HOLD = "On Hold",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
}

export enum ProjectHealthStatus {
  HEALTHY = "Healthy",
  NEEDS_ATTENTION = "Needs Attention",
  CRITICAL = "Critical",
}

export enum ProjectType {
  COMMERCIAL = "Commercial Construction",
  RESIDENTIAL = "Residential Construction",
  INFRASTRUCTURE = "Infrastructure",
  INDUSTRIAL = "Industrial & Logistics",
  INSTITUTIONAL = "Institutional",
}

export enum MilestoneStatus {
  UPCOMING = "Upcoming",
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed",
  DELAYED = "Delayed",
  BLOCKED = "Blocked",
}

export enum TaskStatus {
  NOT_STARTED = "Not Started",
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed",
  DELAYED = "Delayed",
  BLOCKED = "Blocked",
}

export enum IssueCategory {
  CONSTRUCTION_DELAY = "Construction delay",
  WORKFORCE_SHORTAGE = "Workforce shortage",
  MATERIAL_SHORTAGE = "Material shortage",
  EQUIPMENT_BREAKDOWN = "Equipment breakdown",
  SAFETY_INCIDENT = "Safety incident",
  QUALITY_ISSUE = "Quality issue",
  BUDGET_OVERRUN = "Budget overrun",
  CONTRACTOR_ISSUE = "Contractor issue",
  CLIENT_DEPENDENCY = "Client dependency",
  WEATHER_DISRUPTION = "Weather disruption",
  DOCUMENTATION_ISSUE = "Documentation issue",
}

export enum IssueStatus {
  OPEN = "Open",
  ASSIGNED = "Assigned",
  IN_PROGRESS = "In Progress",
  ESCALATED = "Escalated",
  RESOLVED = "Resolved",
  CLOSED = "Closed",
}

export enum PriorityLevel {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  CRITICAL = "Critical",
}

export enum ApprovalCategory {
  PURCHASE_REQUEST = "Project purchase requests",
  MATERIAL_REQUISITION = "Material requisitions",
  EXPENSE_REQUEST = "Project expense requests",
  CONTRACTOR_VERIFICATION = "Contractor work verification",
  MILESTONE_COMPLETION = "Milestone completion",
  SCHEDULE_CHANGE = "Project schedule changes",
  RESOURCE_ALLOCATION = "Resource allocation requests",
  BUDGET_REVISION = "Budget revision requests",
  EQUIPMENT_ALLOCATION = "Equipment allocation requests",
}

export enum ApprovalStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
  CHANGES_REQUESTED = "Changes Requested",
  ESCALATED = "Escalated",
}

export enum DocumentCategory {
  CONTRACTS = "Project contracts",
  DRAWINGS = "Drawings",
  BOQ = "BOQ",
  WORK_ORDERS = "Work orders",
  SITE_REPORTS = "Site reports",
  SAFETY_DOCS = "Safety documents",
  QUALITY_REPORTS = "Quality reports",
  PERMITS = "Permits",
  MATERIAL_DOCS = "Material documents",
  CONTRACTOR_DOCS = "Contractor documents",
  CLIENT_APPROVALS = "Client approvals",
  PHOTOGRAPHS = "Project photographs",
}

export interface ProjectSite {
  id: string;
  organizationId: string;
  projectId: string;
  name: string;
  code: string;
  location: string;
  siteManager: string;
  siteEngineer: string;
  supervisor: string;
  requiredWorkforce: number;
  assignedWorkforce: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  plannedProgress: number;
  actualProgress: number;
  materialStatus: "Adequate" | "Low Stock" | "Critical Shortage";
  equipmentStatus: "Operational" | "Maintenance Due" | "Breakdown";
  safetyIncidents30d: number;
  openIssuesCount: number;
  lastDailyReportDate: string;
  lastDailyReportStatus: "Pending Review" | "Reviewed" | "Correction Requested";
  health: ProjectHealthStatus;
}

export interface ProjectHealthFactor {
  indicator: string;
  value: string;
  threshold: string;
  status: ProjectHealthStatus;
  explanation: string;
}

export interface Project {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  clientName: string;
  location: string;
  type: ProjectType;
  description: string;
  thumbnailUrl: string;
  projectManager: string;
  startDate: string;
  expectedCompletionDate: string;
  revisedCompletionDate?: string;
  actualCompletionDate?: string;
  status: ProjectStatus;
  plannedProgress: number;
  actualProgress: number;
  scheduleVarianceDays: number; // positive = ahead, negative = behind
  contractValueInr: number | null; // null if not authorized
  approvedBudgetInr: number;
  revisedBudgetInr: number;
  committedCostInr: number;
  approvedExpenditureInr: number;
  paidExpenditureInr: number;
  forecastedFinalCostInr: number;
  requiredWorkforce: number;
  assignedWorkforce: number;
  presentToday: number;
  activeContractors: number;
  health: ProjectHealthStatus;
  healthFactors: ProjectHealthFactor[];
  sitesCount: number;
  lastUpdatedAt: string;
}

export interface ProjectPhaseProgress {
  projectId: string;
  reportDate: string;
  planned: number;
  actual: number;
}

export interface ProjectMilestone {
  id: string;
  organizationId: string;
  projectId: string;
  projectName: string;
  siteId: string;
  siteName: string;
  phase: string;
  name: string;
  description: string;
  originalPlannedDate: string;
  revisedDate?: string;
  actualCompletionDate?: string;
  responsiblePerson: string;
  assignedTeam: string;
  completionPercent: number;
  status: MilestoneStatus;
  dependencies: string[];
  revisionHistory: {
    date: string;
    previousDate: string;
    newDate: string;
    reason: string;
    updatedBy: string;
  }[];
  hasSupportingDocs: boolean;
}

export interface ProjectTask {
  id: string;
  organizationId: string;
  projectId: string;
  projectName: string;
  siteId: string;
  siteName: string;
  milestoneId?: string;
  name: string;
  phase: string;
  responsiblePerson: string;
  assignedTeam: string;
  priority: PriorityLevel;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  plannedDurationDays: number;
  actualDurationDays: number;
  progress: number;
  dependencies: string[];
  dueDate: string;
  status: TaskStatus;
}

export interface WorkforceMember {
  id: string;
  organizationId: string;
  employeeId: string;
  name: string;
  designation:
    | "Site Manager"
    | "Site Engineer"
    | "Supervisor"
    | "Foreman"
    | "Mason"
    | "Steel Fixer"
    | "Crane Operator"
    | "Electrician"
    | "Safety Officer"
    | "Helper";
  department: "Civil Works" | "MEP" | "Structural" | "Safety & QC" | "Site Management" | "Equipment Ops";
  employmentType: "Permanent" | "Contractor";
  contractorName?: string;
  projectId: string;
  projectName: string;
  siteId: string;
  siteName: string;
  reportingSupervisor: string;
  attendanceStatus: "Present" | "Absent" | "On Leave" | "Off Shift";
  assignmentStatus: "Active" | "Pending Transfer" | "Completed";
  assignedSince: string;
  // Note: Confidential payroll/salary fields intentionally excluded per PM RBAC rule
}

export interface WorkforceShortageAlert {
  id: string;
  projectId: string;
  projectName: string;
  siteId: string;
  siteName: string;
  designation: string;
  requiredCount: number;
  availableCount: number;
  shortageCount: number;
  impactNote: string;
  requestSubmitted: boolean;
  requestRef?: string;
}

export type CostCategory =
  | "Labour"
  | "Materials"
  | "Equipment"
  | "Contractors"
  | "Transportation"
  | "Site operations"
  | "Safety"
  | "Other approved expenses";

export interface ProjectCostRecord {
  id: string;
  organizationId: string;
  projectId: string;
  projectName: string;
  siteName: string;
  category: CostCategory;
  description: string;
  stage: "Committed" | "Approved Expense" | "Paid Expense";
  amountInr: number;
  vendorOrPayee: string;
  recordedDate: string;
  referenceNo: string;
  remarks?: string;
}

export interface BudgetCategoryBreakdown {
  projectId: string;
  category: CostCategory;
  approvedInr: number;
  committedInr: number;
  approvedExpenseInr: number;
  paidInr: number;
}

export interface MaterialRequest {
  id: string;
  organizationId: string;
  requestNumber: string;
  projectId: string;
  projectName: string;
  siteId: string;
  siteName: string;
  requestedBy: string;
  materialName: string;
  category: "Cement & Concrete" | "Reinforcement Steel" | "Aggregates" | "MEP & Cabling" | "Formwork & Scaffolding" | "Finishing";
  quantity: number;
  unit: string;
  estimatedCostInr: number;
  priority: PriorityLevel;
  requestDate: string;
  approvalStatus: "Pending PM" | "Approved" | "Escalated to Admin" | "Rejected";
  poNumber?: string;
  deliveryStatus: "Not Ordered" | "PO Issued" | "In Transit" | "Receipt Verified" | "Shortage Flagged";
  verifiedReceiptQty?: number;
  currentSiteStock: number;
  minimumThreshold: number;
}

export interface EquipmentAsset {
  id: string;
  organizationId: string;
  equipmentCode: string;
  name: string;
  category: "Tower Crane" | "Concrete Pump" | "Excavator" | "Batching Plant" | "DG Set" | "Hoist";
  projectId: string;
  projectName: string;
  siteId: string;
  siteName: string;
  operatorName: string;
  availability: "Available" | "In Use" | "Idle" | "Breakdown" | "Under Maintenance";
  utilizationPercent: number;
  downtimeHours30d: number;
  maintenanceStatus: "Up to Date" | "Due Soon" | "Overdue" | "In Service";
  nextMaintenanceDate: string;
  reassignmentRequestedTo?: string;
}

export interface ProjectIssue {
  id: string;
  organizationId: string;
  issueCode: string;
  title: string;
  description: string;
  category: IssueCategory;
  projectId: string;
  projectName: string;
  siteId: string;
  siteName: string;
  reportedBy: string;
  assignedTo: string;
  priority: PriorityLevel;
  severity: "Low" | "Moderate" | "High" | "Critical";
  reportedDate: string;
  dueDate: string;
  status: IssueStatus;
  hasPhotoEvidence: boolean;
  resolutionRemarks?: string;
  escalatedToAdmin: boolean;
  history: { timestamp: string; actor: string; note: string }[];
}

export interface ProjectRisk {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  category: IssueCategory;
  likelihood: "Low" | "Medium" | "High";
  impact: "Low" | "Medium" | "High";
  mitigationPlan: string;
  owner: string;
  status: "Active" | "Mitigated" | "Escalated";
}

export interface DailyProgressReport {
  id: string;
  organizationId: string;
  reportCode: string;
  projectId: string;
  projectName: string;
  siteId: string;
  siteName: string;
  reportingDate: string;
  submittedBy: string;
  submittedAt: string;
  workforcePresent: number;
  plannedWork: string;
  workCompleted: string;
  dailyProgressPercent: number;
  materialsConsumed: string[];
  equipmentUsed: string[];
  delaysNoted: string;
  safetyObservations: string;
  qualityObservations: string;
  nextDayPlan: string;
  photoCount: number;
  issuesRaisedCount: number;
  reviewStatus: "Pending Review" | "Reviewed" | "Correction Requested";
  pmComments?: string;
  revisions: {
    version: number;
    submittedAt: string;
    submittedBy: string;
    summary: string;
    pmActionNote?: string;
  }[];
}

export interface ApprovalItem {
  id: string;
  organizationId: string;
  requestNumber: string;
  category: ApprovalCategory;
  projectId: string;
  projectName: string;
  siteName: string;
  title: string;
  description: string;
  submittedBy: string;
  submittedDate: string;
  amountInr: number | null;
  withinPmAuthority: boolean;
  pmAuthorityLimitInr: number;
  supportingDocs: string[];
  previousHistory: string[];
  status: ApprovalStatus;
  decisionRemarks?: string;
  decidedBy?: string;
  decidedAt?: string;
}

export interface ProjectDocument {
  id: string;
  organizationId: string;
  projectId: string;
  projectName: string;
  title: string;
  fileName: string;
  category: DocumentCategory;
  version: string;
  fileSize: string;
  uploadedDate: string;
  uploadedBy: string;
  accessScope: "Assigned Project Team" | "PM & Company Admin Only" | "Client Shared";
  versionHistory: { version: string; uploadedAt: string; uploadedBy: string; notes: string }[];
}

export interface ProjectNotification {
  id: string;
  category:
    | "Milestone Delay"
    | "Daily Report"
    | "Budget Alert"
    | "Workforce Shortage"
    | "Material Delay"
    | "Safety Issue"
    | "Approval Pending"
    | "Equipment Breakdown"
    | "Deadline Approaching";
  title: string;
  message: string;
  projectId: string;
  projectName: string;
  timestamp: string;
  read: boolean;
  targetRoute: string;
  severity: "info" | "warning" | "critical";
}

export interface ActivityLogEntry {
  id: string;
  projectId: string;
  projectName: string;
  siteName: string;
  user: string;
  userRole: string;
  action: string;
  category: "Daily Report" | "Milestone" | "Workforce" | "Material" | "Budget" | "Safety" | "Document" | "Approval" | "Issue";
  timestamp: string;
  statusLabel: string;
}

export interface PMProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  employeeCode: string;
  organizationName: string;
  designation: string;
  avatarUrl: string;
  timezone: string;
  approvalAuthorityLimitInr: number;
  assignedProjectIds: string[];
  permissions: {
    module: string;
    access: "Full (Assigned Projects)" | "Within Authority Limit" | "Read Only" | "Restricted by Admin";
    note: string;
  }[];
}
