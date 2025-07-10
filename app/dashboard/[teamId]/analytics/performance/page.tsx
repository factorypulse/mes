"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AnalyticsFilters, FilterState } from "../components/analytics-filters";
import { ExportButton } from "@/components/analytics/export-button";
import {
  CycleTimeTrendChart,
  DepartmentPerformanceChart,
  PerformanceTrendChart
} from "@/components/analytics/charts";
import {
  TrendingUp,
  Clock,
  Target,
  BarChart3,
  Zap,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";

interface PerformanceData {
  cycleTimeAnalysis: {
    averageCycleTime: number;
    cycleTimeByDepartment: Array<{
      departmentId: string;
      departmentName: string;
      averageCycleTime: number;
      operationsCount: number;
    }>;
    cycleTimeTrend: Array<{
      date: string;
      averageCycleTime: number;
      operationsCount: number;
    }>;
  };
  efficiency: {
    overallEfficiency: number;
    efficiencyByDepartment: Array<{
      departmentId: string;
      departmentName: string;
      averageEfficiency: number;
      operationsCount: number;
    }>;
    efficiencyTrend: Array<{
      date: string;
      efficiency: number;
    }>;
  };
  throughput: {
    operationsPerHour: number;
    throughputByDepartment: Array<{
      departmentId: string;
      departmentName: string;
      operationsPerHour: number;
      operationsCount: number;
    }>;
    throughputTrend: Array<{
      date: string;
      operationsPerHour: number;
      operationsCount: number;
    }>;
  };
  qualityMetrics: {
    completionRate: number;
    reworkRate: number;
    onTimeDelivery: number;
  };
}

export default function PerformancePage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);

  const [filters, setFilters] = useState<FilterState>({
    dateRange: "last7days",
    departments: [],
    operators: []
  });

  const fetchPerformanceData = async () => {
    try {
      setError(null);
      const [performanceRes, departmentsRes] = await Promise.all([
        fetch('/api/analytics/performance'),
        fetch('/api/departments')
      ]);

      if (!performanceRes.ok) {
        throw new Error('Failed to fetch performance data');
      }

      const performanceData = await performanceRes.json();
      setData(performanceData);

      if (departmentsRes.ok) {
        const departmentsData = await departmentsRes.json();
        setDepartments(departmentsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
    const interval = setInterval(fetchPerformanceData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [teamId, filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No performance data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <AnalyticsFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableDepartments={departments}
        />
        <ExportButton
          teamId={teamId}
          exportType="performance"
          departments={departments}
          className="self-start"
        />
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Cycle Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.cycleTimeAnalysis.averageCycleTime}m</div>
            <p className="text-xs text-muted-foreground">Per operation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overall Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.efficiency.overallEfficiency}%</div>
            <p className="text-xs text-muted-foreground">vs standard times</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Throughput
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.throughput.operationsPerHour.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">operations/hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Quality Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{data.qualityMetrics.completionRate}%</div>
            <p className="text-xs text-muted-foreground">completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DepartmentPerformanceChart
          data={data.cycleTimeAnalysis.cycleTimeByDepartment || []}
          title="Cycle Time by Department"
          metric="cycleTime"
        />

        <DepartmentPerformanceChart
          data={data.efficiency.efficiencyByDepartment || []}
          title="Efficiency by Department"
          metric="efficiency"
        />
      </div>

      {/* Throughput and Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DepartmentPerformanceChart
          data={data.throughput.throughputByDepartment || []}
          title="Throughput Analysis"
          metric="throughput"
        />

        <CycleTimeTrendChart
          data={data.cycleTimeAnalysis.cycleTimeTrend || []}
          title="Cycle Time Trends"
          height={300}
        />
      </div>

      {/* Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {data.qualityMetrics.completionRate}%
              </div>
              <Progress value={data.qualityMetrics.completionRate} className="h-3 mb-2" />
              <p className="text-sm text-muted-foreground">
                Operations completed successfully
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              On-Time Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {data.qualityMetrics.onTimeDelivery}%
              </div>
              <Progress value={data.qualityMetrics.onTimeDelivery} className="h-3 mb-2" />
              <p className="text-sm text-muted-foreground">
                Orders delivered on time
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Rework Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {data.qualityMetrics.reworkRate}%
              </div>
              <Progress value={data.qualityMetrics.reworkRate} className="h-3 mb-2" />
              <p className="text-sm text-muted-foreground">
                Operations requiring rework
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trends (Last 7 Days)
          </CardTitle>
          <CardDescription>
            Daily performance metrics overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.cycleTimeAnalysis.cycleTimeTrend.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-medium">{new Date(day.date).toLocaleDateString()}</div>
                    <div className="text-sm text-muted-foreground">{day.operationsCount} operations</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">{day.averageCycleTime}m</div>
                    <div className="text-xs text-muted-foreground">cycle time</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-blue-600">
                      {data.throughput.throughputTrend[index]?.operationsPerHour.toFixed(1) || '0'}/hr
                    </div>
                    <div className="text-xs text-muted-foreground">throughput</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
