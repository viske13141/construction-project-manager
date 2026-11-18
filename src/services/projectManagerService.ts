import { usePMStore } from "../store/pmStore";
import { Project } from "../types/projectManager";

// Service abstraction structured for drop-in Supabase PostgreSQL + RLS replacement
export const projectManagerService = {
  getAssignedProjects: async (): Promise<Project[]> => {
    const state = usePMStore.getState();
    return state.projects.filter((p) =>
      state.profile.assignedProjectIds.includes(p.id)
    );
  },

  getProjectById: async (projectId: string): Promise<Project | undefined> => {
    const state = usePMStore.getState();
    if (!state.profile.assignedProjectIds.includes(projectId)) {
      return undefined; // Enforce assigned-project scope boundary
    }
    return state.projects.find((p) => p.id === projectId);
  },

  getPortfolioSummary: () => {
    const { projects, selectedProjectId, sites } = usePMStore.getState();
    const scoped =
      selectedProjectId === "ALL"
        ? projects
        : projects.filter((p) => p.id === selectedProjectId);

    const activeCount = scoped.filter((p) =>
      ["Active", "On Track", "At Risk", "Delayed"].includes(p.status)
    ).length;
    const onScheduleCount = scoped.filter((p) => p.scheduleVarianceDays >= 0).length;
    const delayedCount = scoped.filter((p) => p.scheduleVarianceDays < 0).length;
    const avgCompletion = scoped.length
      ? Math.round(scoped.reduce((acc, p) => acc + p.actualProgress, 0) / scoped.length)
      : 0;
    const totalWorkforce = scoped.reduce((acc, p) => acc + p.assignedWorkforce, 0);
    const presentToday = scoped.reduce((acc, p) => acc + p.presentToday, 0);
    const totalApprovedBudget = scoped.reduce((acc, p) => acc + p.approvedBudgetInr, 0);
    const totalCommitted = scoped.reduce((acc, p) => acc + p.committedCostInr, 0);
    const totalApprovedExp = scoped.reduce((acc, p) => acc + p.approvedExpenditureInr, 0);
    const totalPaidExp = scoped.reduce((acc, p) => acc + p.paidExpenditureInr, 0);
    const totalForecast = scoped.reduce((acc, p) => acc + p.forecastedFinalCostInr, 0);

    const scopedSites =
      selectedProjectId === "ALL"
        ? sites
        : sites.filter((s) => s.projectId === selectedProjectId);

    return {
      scopedProjects: scoped,
      scopedSites,
      totalAssignedProjects: scoped.length,
      activeCount,
      onScheduleCount,
      delayedCount,
      avgCompletion,
      totalWorkforce,
      presentToday,
      totalApprovedBudget,
      totalCommitted,
      totalApprovedExp,
      totalPaidExp,
      totalForecast,
      remainingBudget: Math.max(0, totalApprovedBudget - totalApprovedExp),
    };
  },
};
