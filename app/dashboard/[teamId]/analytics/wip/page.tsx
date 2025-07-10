"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnalyticsFilters, FilterState } from "../components/analytics-filters";
import { 
  Factory, 
  AlertTriangle, 
  Clock,
  Users,
  BarChart3,
  TrendingDown,
  TrendingUp,
  Loader2,
  Eye,
  Play,
  Pause,
  Square
} from "lucide-react";

interface WIPData {
  totalWipOperations: number;
  wipByDepartment: Array<{
    id: string;
    name: string;
    wipCount: number;
    inProgress: number;
    paused: number;
    pending: number;
    waiting: number;
  }>;
  wipByStatus: {
    pending: number;
    in_progress: number;
    paused: number;
    waiting: number;
  };
  operationsBoard: Array<{
    id: string;
    orderNumber: string;
    routingName: string;
    operationName: string;
    operationNumber: number;
    department: string;
    departmentId: string;
    operatorName: string;
    status: string;
    quantityCompleted: number;
    quantityToProduce: number;
    actualStartTime: string | null;
    updatedAt: string;
  }>;
  bottlenecks: Array<{
    departmentId: string;
    departmentName: string;
    operationName: string;
    wipCount: number;
    severity: 'high' | 'medium' | 'low';
  }>;
}

export default function WIPPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  
  const [data, setData] = useState<WIPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'kanban' | 'list'>('overview');
  
  const [filters, setFilters] = useState<FilterState>({
    dateRange: "today",
    departments: [],
    operators: []
  });

  const fetchWIPData = async () => {
    try {
      setError(null);
      const [wipRes, departmentsRes] = await Promise.all([
        fetch('/api/analytics/wip'),
        fetch('/api/departments')
      ]);

      if (!wipRes.ok) {
        throw new Error('Failed to fetch WIP data');
      }

      const wipData = await wipRes.json();
      setData(wipData);

      if (departmentsRes.ok) {
        const departmentsData = await departmentsRes.json();
        setDepartments(departmentsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load WIP data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWIPData();
    const interval = setInterval(fetchWIPData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [teamId, filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading WIP data...</p>
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
        <p className="text-muted-foreground">No WIP data available</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress': return <Play className="h-4 w-4 text-green-500" />;
      case 'paused': return <Pause className="h-4 w-4 text-orange-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'waiting': return <Square className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'text-green-600 bg-green-50 border-green-200';
      case 'paused': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'pending': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'waiting': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredOperations = selectedDepartment 
    ? data.operationsBoard.filter(op => op.departmentId === selectedDepartment)
    : data.operationsBoard;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <AnalyticsFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableDepartments={departments}
        />
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'overview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('overview')}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Overview
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            <Factory className="h-4 w-4 mr-1" />
            Kanban
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <Eye className="h-4 w-4 mr-1" />
            List
          </Button>
        </div>
      </div>

      {/* WIP Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Factory className="h-4 w-4" />
              Total WIP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalWipOperations}</div>
            <p className="text-xs text-muted-foreground">Operations in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Play className="h-4 w-4 text-green-500" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.wipByStatus.in_progress}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Pause className="h-4 w-4 text-orange-500" />
              Paused
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.wipByStatus.paused}</div>
            <p className="text-xs text-muted-foreground">Temporarily stopped</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Waiting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.wipByStatus.waiting + data.wipByStatus.pending}</div>
            <p className="text-xs text-muted-foreground">Pending start</p>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'overview' && (
        <>
          {/* WIP by Department */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Factory className="h-5 w-5" />
                  WIP by Department
                </CardTitle>
                <CardDescription>
                  Work in progress distribution across departments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.wipByDepartment.map((dept, index) => (
                    <div 
                      key={index} 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedDepartment === dept.id ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedDepartment(selectedDepartment === dept.id ? null : dept.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{dept.name}</h4>
                        <Badge variant="outline">
                          {dept.wipCount} total
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-green-600">{dept.inProgress}</div>
                          <div className="text-xs text-muted-foreground">Active</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-orange-600">{dept.paused}</div>
                          <div className="text-xs text-muted-foreground">Paused</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-600">{dept.pending}</div>
                          <div className="text-xs text-muted-foreground">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-blue-600">{dept.waiting}</div>
                          <div className="text-xs text-muted-foreground">Waiting</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bottlenecks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Bottlenecks
                </CardTitle>
                <CardDescription>
                  Operations with highest WIP levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.bottlenecks.map((bottleneck, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{bottleneck.operationName}</div>
                        <div className="text-sm text-muted-foreground">{bottleneck.departmentName}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={bottleneck.severity === 'high' ? 'destructive' : 
                                   bottleneck.severity === 'medium' ? 'secondary' : 'outline'}
                        >
                          {bottleneck.wipCount} WIP
                        </Badge>
                        {bottleneck.severity === 'high' && <TrendingUp className="h-4 w-4 text-red-500" />}
                        {bottleneck.severity === 'medium' && <TrendingDown className="h-4 w-4 text-orange-500" />}
                      </div>
                    </div>
                  ))}
                  {data.bottlenecks.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No bottlenecks detected
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {viewMode === 'kanban' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Operations Board
              {selectedDepartment && (
                <Badge variant="outline">
                  {departments.find(d => d.id === selectedDepartment)?.name}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Real-time view of all work in progress operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pending Column */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Pending ({filteredOperations.filter(op => op.status === 'pending').length})</span>
                </div>
                {filteredOperations.filter(op => op.status === 'pending').map((op) => (
                  <div key={op.id} className="p-3 border rounded-lg bg-white">
                    <div className="font-medium text-sm mb-1">{op.orderNumber}</div>
                    <div className="text-xs text-muted-foreground mb-2">{op.operationName}</div>
                    <div className="text-xs text-muted-foreground">{op.department}</div>
                  </div>
                ))}
              </div>

              {/* In Progress Column */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                  <Play className="h-4 w-4 text-green-500" />
                  <span className="font-medium">In Progress ({filteredOperations.filter(op => op.status === 'in_progress').length})</span>
                </div>
                {filteredOperations.filter(op => op.status === 'in_progress').map((op) => (
                  <div key={op.id} className="p-3 border border-green-200 bg-green-50 rounded-lg">
                    <div className="font-medium text-sm mb-1">{op.orderNumber}</div>
                    <div className="text-xs text-muted-foreground mb-2">{op.operationName}</div>
                    <div className="text-xs text-muted-foreground mb-1">{op.department}</div>
                    <div className="text-xs text-green-600">{op.operatorName}</div>
                  </div>
                ))}
              </div>

              {/* Paused Column */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                  <Pause className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">Paused ({filteredOperations.filter(op => op.status === 'paused').length})</span>
                </div>
                {filteredOperations.filter(op => op.status === 'paused').map((op) => (
                  <div key={op.id} className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                    <div className="font-medium text-sm mb-1">{op.orderNumber}</div>
                    <div className="text-xs text-muted-foreground mb-2">{op.operationName}</div>
                    <div className="text-xs text-muted-foreground mb-1">{op.department}</div>
                    <div className="text-xs text-orange-600">{op.operatorName}</div>
                  </div>
                ))}
              </div>

              {/* Waiting Column */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                  <Square className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Waiting ({filteredOperations.filter(op => op.status === 'waiting').length})</span>
                </div>
                {filteredOperations.filter(op => op.status === 'waiting').map((op) => (
                  <div key={op.id} className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                    <div className="font-medium text-sm mb-1">{op.orderNumber}</div>
                    <div className="text-xs text-muted-foreground mb-2">{op.operationName}</div>
                    <div className="text-xs text-muted-foreground">{op.department}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'list' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Operations List
              {selectedDepartment && (
                <Badge variant="outline">
                  {departments.find(d => d.id === selectedDepartment)?.name}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Detailed list view of all operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredOperations.map((op) => (
                <div key={op.id} className={`p-4 border rounded-lg ${getStatusColor(op.status)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(op.status)}
                      <div>
                        <div className="font-medium">{op.orderNumber} - {op.operationName}</div>
                        <div className="text-sm text-muted-foreground">{op.routingName}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {op.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Department</div>
                      <div className="font-medium">{op.department}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Operator</div>
                      <div className="font-medium">{op.operatorName}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Progress</div>
                      <div className="font-medium">{op.quantityCompleted}/{op.quantityToProduce}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Updated</div>
                      <div className="font-medium">{new Date(op.updatedAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredOperations.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No operations found for the selected filters
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}