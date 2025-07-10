import { Metadata } from "next";
import { notFound } from "next/navigation";

import { DashboardHeader, ProductionMetrics, QuickStats, ChartsSection } from "./dashboard-client";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Manufacturing Dashboard",
  description: "Real-time manufacturing execution system overview",
};

async function fetchDashboardData(teamId: string): Promise<DashboardData> {
  try {
    const user = await getUser();
    if (!user || !user.selectedTeam?.id) {
      throw new Error("No authenticated user or team");
    }

    // Import the analytics service
    const { AnalyticsService } = await import("@/lib/services/analytics");

    // Get dashboard metrics using the service
    const metrics = await AnalyticsService.getDashboardMetrics(user.id, teamId);

    return metrics;
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // Return fallback data on error
    return {
      ordersPending: 0,
      ordersInProgress: 0,
      ordersPaused: 0,
      ordersWaiting: 0,
      ordersCompletedToday: 0,
      operationsInProgress: 0,
      operationsPaused: 0,
      completedOperationsToday: 0,
      averageCycleTime: 0,
      onTimeDeliveryRate: 0,
      operatorUtilization: 0,
      totalOperators: 0,
      activeOperators: 0,
    };
  }
}

interface DashboardPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

interface DashboardData {
  ordersPending: number;
  ordersInProgress: number;
  ordersPaused: number;
  ordersWaiting: number;
  ordersCompletedToday: number;
  operationsInProgress: number;
  operationsPaused: number;
  completedOperationsToday: number;
  averageCycleTime: number;
  onTimeDeliveryRate: number;
  operatorUtilization: number;
  totalOperators: number;
  activeOperators: number;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { teamId } = await params;

  const user = await getUser();
  if (!user) {
    notFound();
  }

  const dashboardData = await fetchDashboardData(teamId);

  return (
    <div className="min-h-screen">
      {/* Ambient background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" />
        <div
          className="absolute top-1/3 right-1/4 w-72 h-72 bg-chart-2/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-chart-3/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <div className="relative z-10 p-8 space-y-8">
        <DashboardHeader />
        <ProductionMetrics data={dashboardData} />
        <QuickStats dashboardData={dashboardData} />
        <ChartsSection />
      </div>
    </div>
  );
}