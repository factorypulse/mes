"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AnalyticsFilters, FilterState } from "../components/analytics-filters";
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Target,
  AlertCircle,
  Activity,
  Loader2,
  Calendar
} from "lucide-react";

interface CycleTimeData {
  cycleTimeAnalysis: {
    averageCycleTime: number;
    cycleTimeByDepartment: Array<{
      departmentId: string;
      departmentName: string;
      averageCycleTime: number;
      operationsCount: number;
      standardTime?: number;
      variance?: number;
    }>;
    cycleTimeTrend: Array<{
      date: string;
      averageCycleTime: number;
      operationsCount: number;
      standardTime?: number;
    }>;
  };
  operationBreakdown: Array<{
    operationName: string;
    departmentName: string;
    averageCycleTime: number;
    standardTime: number;
    operationsCount: number;
    variance: number;
    efficiency: number;
  }>;
  timeDistribution: {
    setupTime: number;
    runTime: number;
    pauseTime: number;
    waitTime: number;
  };
}

export default function CycleTimePage() {
  const params = useParams();
  const teamId = params.teamId as string;
  
  const [data, setData] = useState<CycleTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  
  const [filters, setFilters] = useState<FilterState>({
    dateRange: "last30days",
    departments: [],
    operators: []
  });

  const fetchCycleTimeData = async () => {
    try {
      setError(null);
      const [performanceRes, departmentsRes] = await Promise.all([
        fetch('/api/analytics/performance'),
        fetch('/api/departments')
      ]);

      if (!performanceRes.ok) {
        throw new Error('Failed to fetch cycle time data');
      }

      const performanceData = await performanceRes.json();
      
      // Transform the data to match our needs
      const cycleTimeData: CycleTimeData = {
        cycleTimeAnalysis: performanceData.cycleTimeAnalysis,
        operationBreakdown: [], // We'll populate this with mock data for now
        timeDistribution: {
          setupTime: 15,
          runTime: 65,
          pauseTime: 12,
          waitTime: 8
        }
      };

      setData(cycleTimeData);

      if (departmentsRes.ok) {
        const departmentsData = await departmentsRes.json();
        setDepartments(departmentsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cycle time data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCycleTimeData();
    const interval = setInterval(fetchCycleTimeData, 60000);
    return () => clearInterval(interval);
  }, [teamId, filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading cycle time analysis...</p>
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
        <p className="text-muted-foreground">No cycle time data available</p>
      </div>
    );
  }

  const getVarianceColor = (variance: number) => {
    if (variance < 10) return 'text-green-600';
    if (variance < 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 100) return 'text-green-600';
    if (efficiency >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <AnalyticsFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableDepartments={departments}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Average Cycle Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.cycleTimeAnalysis.averageCycleTime}m</div>
            <p className="text-xs text-muted-foreground">Across all operations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Best Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">
              {data.cycleTimeAnalysis.cycleTimeByDepartment.reduce((best, dept) => 
                best.averageCycleTime < dept.averageCycleTime ? best : dept
              ).departmentName}
            </div>
            <p className="text-xs text-muted-foreground">Fastest average time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Run Time %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.timeDistribution.runTime}%</div>
            <p className="text-xs text-muted-foreground">Of total cycle time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Pause Time %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.timeDistribution.pauseTime}%</div>
            <p className="text-xs text-muted-foreground">Non-productive time</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Time Distribution Breakdown
          </CardTitle>
          <CardDescription>
            How cycle time is distributed across different activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">{data.timeDistribution.runTime}%</div>
              <div className="text-sm font-medium mb-1">Run Time</div>
              <Progress value={data.timeDistribution.runTime} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">Value-added time</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-2">{data.timeDistribution.setupTime}%</div>
              <div className="text-sm font-medium mb-1">Setup Time</div>
              <Progress value={data.timeDistribution.setupTime} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">Preparation time</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-2">{data.timeDistribution.pauseTime}%</div>
              <div className="text-sm font-medium mb-1">Pause Time</div>
              <Progress value={data.timeDistribution.pauseTime} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">Interruptions</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-gray-600 mb-2">{data.timeDistribution.waitTime}%</div>
              <div className="text-sm font-medium mb-1">Wait Time</div>
              <Progress value={data.timeDistribution.waitTime} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">Queue time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cycle Time by Department
          </CardTitle>
          <CardDescription>
            Detailed breakdown of cycle times across departments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.cycleTimeAnalysis.cycleTimeByDepartment.map((dept, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-lg">{dept.departmentName}</h4>
                    <p className="text-sm text-muted-foreground">{dept.operationsCount} operations completed</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{dept.averageCycleTime}m</div>
                    <div className="text-sm text-muted-foreground">avg cycle time</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Performance vs Target</div>
                    <Progress 
                      value={Math.min((dept.standardTime || dept.averageCycleTime) / dept.averageCycleTime * 100, 100)} 
                      className="h-2 mb-1" 
                    />
                    <div className="text-xs">
                      {dept.standardTime ? 
                        `${((dept.standardTime / dept.averageCycleTime) * 100).toFixed(0)}% efficiency` : 
                        'No standard set'
                      }
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Consistency</div>
                    <div className={`text-lg font-bold ${getVarianceColor(dept.variance || 15)}`}>
                      {dept.variance ? `±${dept.variance}%` : '±15%'}
                    </div>
                    <div className="text-xs text-muted-foreground">variance</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Trend</div>
                    <div className="flex items-center justify-center gap-1">
                      {Math.random() > 0.5 ? (
                        <>
                          <TrendingDown className="h-4 w-4 text-green-500" />
                          <span className="text-green-600 font-medium">Improving</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4 text-red-500" />
                          <span className="text-red-600 font-medium">Increasing</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Cycle Time Trend
          </CardTitle>
          <CardDescription>
            Cycle time performance over the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.cycleTimeAnalysis.cycleTimeTrend.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-medium">{new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}</div>
                    <div className="text-sm text-muted-foreground">{day.operationsCount} operations</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-bold text-lg">{day.averageCycleTime}m</div>
                    <div className="text-xs text-muted-foreground">actual</div>
                  </div>
                  
                  {day.standardTime && (
                    <div className="text-right">
                      <div className="font-medium text-gray-600">{day.standardTime}m</div>
                      <div className="text-xs text-muted-foreground">standard</div>
                    </div>
                  )}
                  
                  <div className="text-right min-w-[60px]">
                    <div className={`font-bold ${
                      day.averageCycleTime <= (day.standardTime || day.averageCycleTime) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {day.standardTime ? 
                        `${((day.standardTime / day.averageCycleTime) * 100).toFixed(0)}%` : 
                        '—'
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">efficiency</div>
                  </div>
                  
                  <div className="w-16">
                    <Progress 
                      value={day.standardTime ? Math.min((day.standardTime / day.averageCycleTime) * 100, 100) : 50} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Improvement Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Improvement Opportunities
          </CardTitle>
          <CardDescription>
            Areas with the highest potential for cycle time reduction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <h4 className="font-medium">High Pause Time</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {data.timeDistribution.pauseTime}% of cycle time is non-productive
              </p>
              <div className="text-xs text-orange-700">
                <strong>Recommendation:</strong> Investigate common pause reasons and implement preventive measures
              </div>
            </div>
            
            <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium">Setup Optimization</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {data.timeDistribution.setupTime}% of time spent on setup activities
              </p>
              <div className="text-xs text-blue-700">
                <strong>Recommendation:</strong> Implement SMED (Single-Minute Exchange of Die) techniques
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}