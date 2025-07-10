"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/analytics/export-button";
import {
  WIPDistributionChart,
  CycleTimeTrendChart,
  DepartmentPerformanceChart,
} from "@/components/analytics/charts";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Loader2,
  Factory,
  LucideIcon,
} from "lucide-react";

interface AnalyticsData {
  dashboardMetrics: any;
  recentActivity: any[];
  wipData: any;
  performanceData: any;
}

export default function AnalyticsPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalyticsData = async () => {
    try {
      setError(null);
      const [dashboardRes, wipRes, performanceRes, activityRes] =
        await Promise.all([
          fetch("/api/analytics/dashboard"),
          fetch("/api/analytics/wip"),
          fetch("/api/analytics/performance"),
          fetch("/api/analytics/recent-activity"),
        ]);

      if (
        !dashboardRes.ok ||
        !wipRes.ok ||
        !performanceRes.ok ||
        !activityRes.ok
      ) {
        throw new Error("Failed to fetch analytics data");
      }

      const [dashboardMetrics, wipData, performanceData, recentActivity] =
        await Promise.all([
          dashboardRes.json(),
          wipRes.json(),
          performanceRes.json(),
          activityRes.json(),
        ]);

      setData({
        dashboardMetrics,
        wipData,
        performanceData,
        recentActivity,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load analytics data"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
  };

  useEffect(() => {
    fetchAnalyticsData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchAnalyticsData, 30000);

    return () => clearInterval(interval);
  }, [teamId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

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

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200"
            >
              <Activity className="h-3 w-3 mr-1" />
              Live Data
            </Badge>
            <span className="text-sm text-muted-foreground">
              Updates every 30 seconds
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton
              teamId={teamId}
              exportType="dashboard"
              className="h-9"
            />
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        <OverviewMetrics data={data.dashboardMetrics} />
        <WIPAnalysis data={data.wipData} />
        <PerformanceAnalysis data={data.performanceData} />
        <RecentActivityFeed data={data.recentActivity} />
      </div>
    </div>
  );
}

function OverviewMetrics({ data }: { data: any }) {
  if (!data) {
    return (
      <div className="bento-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-8 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalActiveOrders =
    data.ordersPending +
    data.ordersInProgress +
    data.ordersPaused +
    data.ordersWaiting;

  const getIcon = (iconName: string): LucideIcon => {
    const iconMap: Record<string, LucideIcon> = {
      activity: Activity,
      factory: Factory,
      clock: Clock,
      users: Users,
    };
    return iconMap[iconName] || Activity;
  };

  interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon: string;
    variant?: "default" | "success" | "warning";
  }

  const MetricCard = ({ title, value, subtitle, icon, variant = "default" }: MetricCardProps) => {
    const IconComponent = getIcon(icon);
    const variantClasses = {
      default: "border-primary/30 bg-primary/5",
      success: "border-green-500/30 bg-green-500/5",
      warning: "border-yellow-500/30 bg-yellow-500/5",
    };

    return (
      <Card className={`relative ${variantClasses[variant]}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <div className="p-2 rounded-lg bg-primary/10">
              <IconComponent className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="bento-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Active Orders"
        value={totalActiveOrders}
        subtitle={`${data.ordersCompletedToday} completed today`}
        icon="activity"
        variant="default"
      />
      <MetricCard
        title="Operations Running"
        value={data.operationsInProgress}
        subtitle={`${data.operationsPaused} paused`}
        icon="factory"
        variant="success"
      />
      <MetricCard
        title="Avg Cycle Time"
        value={`${data.averageCycleTime}m`}
        subtitle="Per operation"
        icon="clock"
        variant="default"
      />
      <MetricCard
        title="Operator Utilization"
        value={`${data.operatorUtilization}%`}
        subtitle={`${data.activeOperators}/${data.totalOperators} active`}
        icon="users"
        variant="default"
      />
    </div>
  );
}

function WIPAnalysis({ data }: { data: any }) {
  if (!data) {
    return (
      <div className="bento-grid grid-cols-1 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-4 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="bento-grid grid-cols-1 lg:grid-cols-2">
      <WIPDistributionChart
        data={
          data.wipByStatus || {
            pending: 0,
            in_progress: 0,
            paused: 0,
            waiting: 0,
          }
        }
        title="Work In Progress Distribution"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Bottlenecks
          </CardTitle>
          <CardDescription>Operations with highest WIP</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data.bottlenecks || [])
              .slice(0, 5)
              .map((bottleneck: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {bottleneck.operationName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {bottleneck.departmentName}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        bottleneck.severity === "high"
                          ? "destructive"
                          : bottleneck.severity === "medium"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {bottleneck.wipCount}
                    </Badge>
                  </div>
                </div>
              ))}
            {(!data.bottlenecks || data.bottlenecks.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No bottlenecks detected
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PerformanceAnalysis({ data }: { data: any }) {
  if (!data) {
    return (
      <div className="bento-grid grid-cols-1 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-4 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="bento-grid grid-cols-1 lg:grid-cols-3">
      <DepartmentPerformanceChart
        data={data.cycleTimeAnalysis?.cycleTimeByDepartment || []}
        title="Cycle Time by Department"
        metric="cycleTime"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Efficiency
          </CardTitle>
          <CardDescription>Performance vs. standard times</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.efficiency?.overallEfficiency || 0}%
              </div>
              <div className="text-sm text-muted-foreground">
                Overall Efficiency
              </div>
            </div>
            <div className="space-y-2">
              {(data.efficiency?.efficiencyByDepartment || [])
                .slice(0, 3)
                .map((dept: any, index: number) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{dept.departmentName}</span>
                      <span className="font-medium">
                        {dept.averageEfficiency}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min(dept.averageEfficiency, 100)}
                      className="h-2"
                    />
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Quality Metrics
          </CardTitle>
          <CardDescription>Production quality indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completion Rate</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-bold text-green-600">
                  {data.qualityMetrics?.completionRate || 0}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">On-Time Delivery</span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="font-bold text-blue-600">
                  {data.qualityMetrics?.onTimeDelivery || 0}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Throughput</span>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" />
                <span className="font-bold text-purple-600">
                  {data.throughput?.operationsPerHour?.toFixed(1) || 0}/hr
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RecentActivityFeed({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest operation updates and completions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Latest operation updates and completions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {data.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {activity.orderNumber}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {activity.activity}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {activity.operationName} • {activity.department}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {activity.operatorName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {activity.quantityCompleted} completed
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
