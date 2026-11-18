import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { PMShell } from "./components/layout/PMShell";
import { OverviewPage } from "./pages/Overview/OverviewPage";
import { MyProjectsPage } from "./pages/MyProjects/MyProjectsPage";
import { ProjectDetailsPage } from "./pages/ProjectDetails/ProjectDetailsPage";
import { ProjectComparisonPage } from "./pages/ProjectComparison/ProjectComparisonPage";
import { ProjectTimelinePage } from "./pages/ProjectTimeline/ProjectTimelinePage";
import { MilestonesTasksPage } from "./pages/Milestones/MilestonesTasksPage";
import { ProjectWorkforcePage } from "./pages/Workforce/ProjectWorkforcePage";
import { SitePerformancePage } from "./pages/SitePerformance/SitePerformancePage";
import { BudgetCostControlPage } from "./pages/Budget/BudgetCostControlPage";
import { MaterialsProcurementPage } from "./pages/Materials/MaterialsProcurementPage";
import { EquipmentAssetsPage } from "./pages/Equipment/EquipmentAssetsPage";
import { IssuesRisksPage } from "./pages/Issues/IssuesRisksPage";
import { DailyProgressReportsPage } from "./pages/DailyReports/DailyProgressReportsPage";
import { ApprovalsPage } from "./pages/Approvals/ApprovalsPage";
import { ProjectDocumentsPage } from "./pages/Documents/ProjectDocumentsPage";
import { ReportsAnalyticsPage } from "./pages/Reports/ReportsAnalyticsPage";
import { NotificationsPage } from "./pages/Notifications/NotificationsPage";
import {
  MyProfilePage,
  SettingsPage,
} from "./pages/ProfileSettings/ProfileAndSettingsPages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<PMShell />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/projects" element={<MyProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
            <Route path="/comparison" element={<ProjectComparisonPage />} />
            <Route path="/timeline" element={<ProjectTimelinePage />} />
            <Route path="/milestones" element={<MilestonesTasksPage />} />
            <Route path="/workforce" element={<ProjectWorkforcePage />} />
            <Route path="/sites" element={<SitePerformancePage />} />
            <Route path="/budget" element={<BudgetCostControlPage />} />
            <Route path="/materials" element={<MaterialsProcurementPage />} />
            <Route path="/equipment" element={<EquipmentAssetsPage />} />
            <Route path="/issues" element={<IssuesRisksPage />} />
            <Route path="/daily-reports" element={<DailyProgressReportsPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/documents" element={<ProjectDocumentsPage />} />
            <Route path="/reports" element={<ReportsAnalyticsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<MyProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
