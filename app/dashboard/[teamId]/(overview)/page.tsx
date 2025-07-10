import { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { RecentActivity } from "@/app/dashboard/[teamId]/(overview)/recent-activity";
import { Graph } from "./graph";
import { MetricsCard } from "@/components/ui/metrics-card";

import { StatusIndicator } from "@/components/ui/status-indicator";
import { ColorModeSwitcher } from "@/components/color-mode-switcher";
import { BarChart3, Zap, Clock } from "lucide-react";
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

async function fetchRecentActivity(teamId: string): Promise<ActivityData[]> {
  try {
    const user = await getUser();
    if (!user || !user.selectedTeam?.id) {
      return [];
    }

    // Import the analytics service
    const { AnalyticsService } = await import("@/lib/services/analytics");

    // Get recent activity using the service
    const activities = await AnalyticsService.getRecentActivity(user.id, teamId, 10);

    return activities;
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return [];
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

interface ActivityData {
  id: string;
  orderNumber: string;
  routingName: string;
  operationName: string;
  operationNumber: number;
  department: string;
  operatorName: string;
  status: string;
  statusColor: string;
  activity: string;
  timestamp: string;
  quantityCompleted: number;
}

function DashboardHeader() {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-4xl font-bold gradient-text mb-2">
          Manufacturing Overview
        </h1>
        <p className="text-muted-foreground text-lg">
          Real-time production insights and system performance
        </p>
      </div>
      <div className="flex items-center gap-4">
        <StatusIndicator status="active" label="System Online" />
      </div>
    </div>
  );
}

function ProductionMetrics({ data }: { data: any }) {
  const totalActiveOrders =
    data.ordersPending +
    data.ordersInProgress +
    data.ordersPaused +
    data.ordersWaiting;

  return (
    <div className="bento-grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5">
      <MetricsCard
        title="Live Orders"
        value={totalActiveOrders}
        change={{ value: "Total active", trend: "neutral" }}
        icon="activity"
        variant="default"
      />

      <MetricsCard
        title="Ops in progress"
        value={data.operationsInProgress}
        change={{ value: "Currently active", trend: "neutral" }}
        icon="factory"
        variant="success"
      />

      <MetricsCard
        title="Ops paused"
        value={data.operationsPaused}
        change={{ value: "Currently paused", trend: "neutral" }}
        icon="alert-triangle"
        variant="warning"
      />

      <MetricsCard
        title="Orders completed (today)"
        value={data.ordersCompletedToday}
        change={{ value: "Orders finished", trend: "neutral" }}
        icon="check-circle"
        variant="success"
      />

      <MetricsCard
        title="Avg cycle time"
        value={data.averageCycleTime > 0 ? `${data.averageCycleTime}m` : "N/A"}
        change={{ value: "Per order", trend: "neutral" }}
        icon="clock"
        variant="default"
      />
    </div>
  );
}

function QuickStats({ dashboardData }: { dashboardData: DashboardData }) {
  return (
    <div className="bento-grid grid-cols-1 lg:grid-cols-3">
      {/* Order Status */}
      <div className="bento-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Order Status</h3>
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pending</span>
            <div className="flex items-center gap-2">
              <StatusIndicator status="waiting" variant="dot" size="sm" />
              <span className="font-semibold text-gray-500">
                {dashboardData.ordersPending}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">In Progress</span>
            <div className="flex items-center gap-2">
              <StatusIndicator
                status="active"
                variant="dot"
                size="sm"
                animate
              />
              <span className="font-semibold text-green-500">
                {dashboardData.ordersInProgress}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Paused</span>
            <div className="flex items-center gap-2">
              <StatusIndicator status="warning" variant="dot" size="sm" />
              <span className="font-semibold text-orange-500">
                {dashboardData.ordersPaused}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Waiting</span>
            <div className="flex items-center gap-2">
              <StatusIndicator status="waiting" variant="dot" size="sm" />
              <span className="font-semibold text-blue-500">
                {dashboardData.ordersWaiting}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Operations Status */}
      <div className="bento-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Operations Status</h3>
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Running</span>
            <div className="flex items-center gap-2">
              <StatusIndicator
                status="active"
                variant="dot"
                size="sm"
                animate
              />
              <span className="font-semibold text-green-500">
                {dashboardData.operationsInProgress}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Paused</span>
            <div className="flex items-center gap-2">
              <StatusIndicator status="warning" variant="dot" size="sm" />
              <span className="font-semibold text-orange-500">
                {dashboardData.operationsPaused}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Completed Today
            </span>
            <div className="flex items-center gap-2">
              <StatusIndicator status="active" variant="dot" size="sm" />
              <span className="font-semibold text-blue-500">
                {dashboardData.completedOperationsToday}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Avg Cycle Time
            </span>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="font-semibold">
                {dashboardData.averageCycleTime > 0
                  ? `${dashboardData.averageCycleTime}m`
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bento-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">System Health</h3>
          <Zap className="h-5 w-5 text-primary" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Database</span>
            <StatusIndicator status="active" variant="dot" size="sm" animate />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">API Services</span>
            <StatusIndicator status="active" variant="dot" size="sm" animate />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Real-time Sync</span>
            <StatusIndicator status="active" variant="dot" size="sm" animate />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartsSection() {
  return (
    <div className="bento-grid grid-cols-1 lg:grid-cols-7">
      <div className="lg:col-span-4 bento-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-1">Production Overview</h3>
            <p className="text-sm text-muted-foreground">
              Hourly production trends and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-500">
              Live Data
            </span>
          </div>
        </div>
        <div className="h-[300px]">
          <Graph />
        </div>
      </div>

      <div className="lg:col-span-3 bento-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-1">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">
              Latest order completions and updates
            </p>
          </div>
          <Clock className="h-5 w-5 text-primary" />
        </div>
        <Suspense
          fallback={
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="glass-subtle rounded-lg p-3 animate-pulse"
                >
                  <div className="h-4 bg-muted/20 rounded mb-2" />
                  <div className="h-3 bg-muted/10 rounded w-3/4" />
                </div>
              ))}
            </div>
          }
        >
          <RecentActivity />
        </Suspense>
      </div>
    </div>
  );
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
