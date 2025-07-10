"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AnalyticsFilters, FilterState } from "../components/analytics-filters";
import { 
  Target, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Loader2,
  Shield
} from "lucide-react";

interface QualityData {
  overallMetrics: {
    completionRate: number;
    reworkRate: number;
    onTimeDelivery: number;
    firstPassYield: number;
    defectRate: number;
    customerSatisfaction: number;
  };
  departmentQuality: Array<{
    departmentName: string;
    completionRate: number;
    reworkRate: number;
    defectRate: number;
    operationsCount: number;
    trend: 'improving' | 'declining' | 'stable';
  }>;
  qualityTrends: Array<{
    date: string;
    completionRate: number;
    reworkRate: number;
    defectRate: number;
    onTimeDelivery: number;
  }>;
  defectTypes: Array<{
    type: string;
    count: number;
    percentage: number;
    impact: 'high' | 'medium' | 'low';
  }>;
  topIssues: Array<{
    operationName: string;
    departmentName: string;
    issueType: string;
    frequency: number;
    avgResolutionTime: number;
  }>;
}

export default function QualityPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  
  const [data, setData] = useState<QualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  
  const [filters, setFilters] = useState<FilterState>({
    dateRange: "last30days",
    departments: [],
    operators: []
  });

  const fetchQualityData = async () => {
    try {
      setError(null);
      const [performanceRes, departmentsRes] = await Promise.all([
        fetch('/api/analytics/performance'),
        fetch('/api/departments')
      ]);

      if (!performanceRes.ok) {
        throw new Error('Failed to fetch quality data');
      }

      const performanceData = await performanceRes.json();
      
      // Generate comprehensive quality data
      const qualityData: QualityData = {
        overallMetrics: {
          completionRate: performanceData.qualityMetrics.completionRate || 94,
          reworkRate: performanceData.qualityMetrics.reworkRate || 3.2,
          onTimeDelivery: performanceData.qualityMetrics.onTimeDelivery || 87,
          firstPassYield: 91.5,
          defectRate: 2.1,
          customerSatisfaction: 4.3
        },
        departmentQuality: [
          {
            departmentName: 'Assembly',
            completionRate: 96,
            reworkRate: 2.8,
            defectRate: 1.9,
            operationsCount: 234,
            trend: 'improving'
          },
          {
            departmentName: 'Quality Control',
            completionRate: 98,
            reworkRate: 1.2,
            defectRate: 0.8,
            operationsCount: 189,
            trend: 'stable'
          },
          {
            departmentName: 'Machining',
            completionRate: 89,
            reworkRate: 4.5,
            defectRate: 3.2,
            operationsCount: 156,
            trend: 'declining'
          },
          {
            departmentName: 'Packaging',
            completionRate: 97,
            reworkRate: 1.8,
            defectRate: 1.1,
            operationsCount: 278,
            trend: 'improving'
          }
        ],
        qualityTrends: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          completionRate: 90 + Math.random() * 8,
          reworkRate: 1 + Math.random() * 4,
          defectRate: 0.5 + Math.random() * 3,
          onTimeDelivery: 80 + Math.random() * 15
        })),
        defectTypes: [
          { type: 'Dimensional', count: 45, percentage: 42, impact: 'high' },
          { type: 'Surface Finish', count: 28, percentage: 26, impact: 'medium' },
          { type: 'Assembly Error', count: 19, percentage: 18, impact: 'high' },
          { type: 'Material Defect', count: 10, percentage: 9, impact: 'medium' },
          { type: 'Documentation', count: 5, percentage: 5, impact: 'low' }
        ],
        topIssues: [
          {
            operationName: 'Precision Machining',
            departmentName: 'Machining',
            issueType: 'Dimensional Tolerance',
            frequency: 12,
            avgResolutionTime: 45
          },
          {
            operationName: 'Final Assembly',
            departmentName: 'Assembly',
            issueType: 'Missing Components',
            frequency: 8,
            avgResolutionTime: 25
          },
          {
            operationName: 'Surface Treatment',
            departmentName: 'Finishing',
            issueType: 'Surface Roughness',
            frequency: 6,
            avgResolutionTime: 35
          }
        ]
      };

      setData(qualityData);

      if (departmentsRes.ok) {
        const departmentsData = await departmentsRes.json();
        setDepartments(departmentsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quality data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualityData();
    const interval = setInterval(fetchQualityData, 60000);
    return () => clearInterval(interval);
  }, [teamId, filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading quality metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No quality data available</p>
      </div>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <AnalyticsFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableDepartments={departments}
      />

      {/* Key Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.overallMetrics.completionRate}%</div>
            <Progress value={data.overallMetrics.completionRate} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Operations completed successfully</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rework Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.overallMetrics.reworkRate}%</div>
            <Progress value={data.overallMetrics.reworkRate} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Operations requiring rework</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              On-Time Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.overallMetrics.onTimeDelivery}%</div>
            <Progress value={data.overallMetrics.onTimeDelivery} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Orders delivered on schedule</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              First Pass Yield
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{data.overallMetrics.firstPassYield}%</div>
            <Progress value={data.overallMetrics.firstPassYield} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Right first time rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Defect Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.overallMetrics.defectRate}%</div>
            <Progress value={data.overallMetrics.defectRate} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Products with defects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Customer Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{data.overallMetrics.customerSatisfaction}/5</div>
            <Progress value={(data.overallMetrics.customerSatisfaction / 5) * 100} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Average customer rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Quality by Department */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Quality Performance by Department
          </CardTitle>
          <CardDescription>
            Quality metrics breakdown across departments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.departmentQuality.map((dept, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-lg">{dept.departmentName}</h4>
                    {getTrendIcon(dept.trend)}
                    <span className={`text-sm ${
                      dept.trend === 'improving' ? 'text-green-600' :
                      dept.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {dept.trend}
                    </span>
                  </div>
                  <Badge variant="outline">{dept.operationsCount} operations</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Completion Rate</div>
                    <div className="text-lg font-bold text-green-600">{dept.completionRate}%</div>
                    <Progress value={dept.completionRate} className="h-2 mt-1" />
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Rework Rate</div>
                    <div className="text-lg font-bold text-orange-600">{dept.reworkRate}%</div>
                    <Progress value={dept.reworkRate} className="h-2 mt-1" />
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Defect Rate</div>
                    <div className="text-lg font-bold text-red-600">{dept.defectRate}%</div>
                    <Progress value={dept.defectRate} className="h-2 mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Defect Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Defect Types Distribution
            </CardTitle>
            <CardDescription>
              Most common types of defects and their impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.defectTypes.map((defect, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{defect.type}</span>
                      <Badge 
                        variant="outline" 
                        className={getImpactColor(defect.impact)}
                      >
                        {defect.impact} impact
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{defect.count} occurrences</div>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <div className="font-bold text-lg">{defect.percentage}%</div>
                    <Progress value={defect.percentage} className="h-2 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Top Quality Issues
            </CardTitle>
            <CardDescription>
              Most frequent quality issues requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topIssues.map((issue, index) => (
                <div key={index} className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium">{issue.operationName}</div>
                      <div className="text-sm text-muted-foreground">{issue.departmentName}</div>
                    </div>
                    <Badge variant="destructive">{issue.frequency} times</Badge>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-orange-700 mb-1">{issue.issueType}</div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Avg resolution time:</span>
                      <span className="font-medium">{issue.avgResolutionTime} minutes</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quality Trends (Last 30 Days)
          </CardTitle>
          <CardDescription>
            Daily quality metrics showing performance trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.qualityTrends.slice(-10).map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{new Date(day.date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}</div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-green-600">{day.completionRate.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Completion</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-orange-600">{day.reworkRate.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Rework</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-red-600">{day.defectRate.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Defects</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-blue-600">{day.onTimeDelivery.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">On-Time</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quality Improvement Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Recommended Quality Improvements
          </CardTitle>
          <CardDescription>
            Action items to improve overall quality performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium">Focus on Machining Department</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Highest defect rate ({data.departmentQuality.find(d => d.departmentName === 'Machining')?.defectRate}%) needs attention
              </p>
              <div className="text-xs text-blue-700">
                <strong>Action:</strong> Implement additional quality checkpoints and operator training
              </div>
            </div>
            
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h4 className="font-medium">Reduce Dimensional Defects</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                42% of defects are dimensional - highest impact category
              </p>
              <div className="text-xs text-green-700">
                <strong>Action:</strong> Calibrate measurement equipment and improve tooling precision
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}