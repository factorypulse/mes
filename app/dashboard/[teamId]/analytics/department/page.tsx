"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AnalyticsFilters, FilterState } from "../components/analytics-filters";
import {
  Users,
  Activity,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Star,
  Award,
  Loader2,
  AlertCircle,
  User
} from "lucide-react";

interface OperatorData {
  operators: Array<{
    id: string;
    name: string;
    departmentName: string;
    totalOperations: number;
    completedOperations: number;
    averageCycleTime: number;
    efficiency: number;
    utilization: number;
    qualityScore: number;
    activeTime: number;
    lastActive: string;
    status: 'active' | 'idle' | 'offline';
  }>;
  departmentStats: Array<{
    departmentName: string;
    operatorCount: number;
    averageEfficiency: number;
    averageUtilization: number;
    totalOperations: number;
  }>;
  overallStats: {
    totalOperators: number;
    activeOperators: number;
    averageEfficiency: number;
    averageUtilization: number;
    topPerformer: string;
  };
}

export default function OperatorsPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const [data, setData] = useState<OperatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);

  const [filters, setFilters] = useState<FilterState>({
    dateRange: "last7days",
    departments: [],
    operators: []
  });

  const fetchOperatorData = async () => {
    try {
      setError(null);
      const [dashboardRes, departmentsRes] = await Promise.all([
        fetch('/api/analytics/dashboard'),
        fetch('/api/departments')
      ]);

      if (!dashboardRes.ok) {
        throw new Error('Failed to fetch operator data');
      }

      const dashboardData = await dashboardRes.json();

      // Generate mock operator data for demonstration
      const mockOperatorData: OperatorData = {
        operators: [
          {
            id: '1',
            name: 'John Smith',
            departmentName: 'Assembly',
            totalOperations: 45,
            completedOperations: 42,
            averageCycleTime: 28.5,
            efficiency: 95,
            utilization: 87,
            qualityScore: 98,
            activeTime: 420, // minutes
            lastActive: new Date().toISOString(),
            status: 'active'
          },
          {
            id: '2',
            name: 'Sarah Johnson',
            departmentName: 'Quality Control',
            totalOperations: 38,
            completedOperations: 36,
            averageCycleTime: 22.3,
            efficiency: 102,
            utilization: 92,
            qualityScore: 99,
            activeTime: 445,
            lastActive: new Date(Date.now() - 300000).toISOString(),
            status: 'active'
          },
          {
            id: '3',
            name: 'Mike Wilson',
            departmentName: 'Machining',
            totalOperations: 52,
            completedOperations: 48,
            averageCycleTime: 35.7,
            efficiency: 88,
            utilization: 78,
            qualityScore: 94,
            activeTime: 380,
            lastActive: new Date(Date.now() - 1800000).toISOString(),
            status: 'idle'
          },
          {
            id: '4',
            name: 'Lisa Brown',
            departmentName: 'Packaging',
            totalOperations: 67,
            completedOperations: 65,
            averageCycleTime: 15.2,
            efficiency: 105,
            utilization: 95,
            qualityScore: 97,
            activeTime: 470,
            lastActive: new Date().toISOString(),
            status: 'active'
          },
          {
            id: '5',
            name: 'David Lee',
            departmentName: 'Assembly',
            totalOperations: 41,
            completedOperations: 38,
            averageCycleTime: 31.8,
            efficiency: 82,
            utilization: 74,
            qualityScore: 91,
            activeTime: 350,
            lastActive: new Date(Date.now() - 3600000).toISOString(),
            status: 'offline'
          }
        ],
        departmentStats: [
          {
            departmentName: 'Assembly',
            operatorCount: 2,
            averageEfficiency: 89,
            averageUtilization: 81,
            totalOperations: 86
          },
          {
            departmentName: 'Quality Control',
            operatorCount: 1,
            averageEfficiency: 102,
            averageUtilization: 92,
            totalOperations: 38
          },
          {
            departmentName: 'Machining',
            operatorCount: 1,
            averageEfficiency: 88,
            averageUtilization: 78,
            totalOperations: 52
          },
          {
            departmentName: 'Packaging',
            operatorCount: 1,
            averageEfficiency: 105,
            averageUtilization: 95,
            totalOperations: 67
          }
        ],
        overallStats: {
          totalOperators: 5,
          activeOperators: 3,
          averageEfficiency: 94,
          averageUtilization: 85,
          topPerformer: 'Lisa Brown'
        }
      };

      setData(mockOperatorData);

      if (departmentsRes.ok) {
        const departmentsData = await departmentsRes.json();
        setDepartments(departmentsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load operator data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperatorData();
    const interval = setInterval(fetchOperatorData, 60000);
    return () => clearInterval(interval);
  }, [teamId, filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading department analytics...</p>
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
        <p className="text-muted-foreground">No operator data available</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'idle': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'offline': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPerformanceRating = (efficiency: number, utilization: number, qualityScore: number) => {
    const avgScore = (efficiency + utilization + qualityScore) / 3;
    if (avgScore >= 95) return { rating: 'Excellent', color: 'text-green-600', stars: 5 };
    if (avgScore >= 85) return { rating: 'Good', color: 'text-blue-600', stars: 4 };
    if (avgScore >= 75) return { rating: 'Average', color: 'text-yellow-600', stars: 3 };
    if (avgScore >= 65) return { rating: 'Below Average', color: 'text-orange-600', stars: 2 };
    return { rating: 'Needs Improvement', color: 'text-red-600', stars: 1 };
  };

  return (
    <div className="space-y-6">
      <AnalyticsFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableDepartments={departments}
        showOperatorFilter={true}
        availableOperators={data.operators.map(op => ({ id: op.id, name: op.name }))}
      />

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Operators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overallStats.totalOperators}</div>
            <p className="text-xs text-green-600">{data.overallStats.activeOperators} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Avg Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.overallStats.averageEfficiency}%</div>
            <p className="text-xs text-muted-foreground">Across all operators</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Avg Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.overallStats.averageUtilization}%</div>
            <p className="text-xs text-muted-foreground">Active time ratio</p>
          </CardContent>
        </Card>


      </div>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Performance by Department
          </CardTitle>
          <CardDescription>
             Performance metrics grouped by department
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.departmentStats.map((dept, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-lg">{dept.departmentName}</h4>
                  <Badge variant="outline">{dept.operatorCount} operators</Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">{dept.averageEfficiency}%</div>
                    <div className="text-xs text-muted-foreground">Efficiency</div>
                    <Progress value={dept.averageEfficiency} className="h-1 mt-1" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{dept.averageUtilization}%</div>
                    <div className="text-xs text-muted-foreground">Utilization</div>
                    <Progress value={dept.averageUtilization} className="h-1 mt-1" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">{dept.totalOperations}</div>
                    <div className="text-xs text-muted-foreground">Operations</div>
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
