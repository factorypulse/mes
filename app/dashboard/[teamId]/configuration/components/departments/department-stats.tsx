"use client";

import { Building2, CheckCircle, XCircle, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Department } from "./departments-tab";

interface DepartmentStatsProps {
  departments: Department[];
}

export function DepartmentStats({ departments }: DepartmentStatsProps) {
  // Calculate statistics
  const totalDepartments = departments.length;
  const activeDepartments = departments.filter((dept) => dept.isActive).length;
  const inactiveDepartments = totalDepartments - activeDepartments;
  const totalOperations = departments.reduce(
    (sum, dept) => sum + (dept._count?.routingOperations || 0),
    0
  );

  // Find most used department
  const mostUsedDepartment = departments.reduce((prev, current) => {
    const prevCount = prev._count?.routingOperations || 0;
    const currentCount = current._count?.routingOperations || 0;
    return currentCount > prevCount ? current : prev;
  }, departments[0]);

  const stats = [
    {
      title: "Total Departments",
      value: totalDepartments,
      icon: Building2,
      description: "All departments in your system",
      color: "text-blue-600",
    },
    {
      title: "Active Departments",
      value: activeDepartments,
      icon: CheckCircle,
      description: "Currently active departments",
      color: "text-green-600",
    },
    {
      title: "Inactive Departments",
      value: inactiveDepartments,
      icon: XCircle,
      description: "Departments not currently in use",
      color: "text-gray-600",
    },
    {
      title: "Total Operations",
      value: totalOperations,
      icon: Settings,
      description: "Operations across all departments",
      color: "text-purple-600",
    },
  ];

  if (departments.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Insights */}
      {totalDepartments > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Most Used Department */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Most Active Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mostUsedDepartment &&
              (mostUsedDepartment._count?.routingOperations || 0) > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {mostUsedDepartment.name}
                    </span>
                  </div>
                  <Badge variant="outline">
                    {mostUsedDepartment._count?.routingOperations || 0}{" "}
                    operations
                  </Badge>
                  {mostUsedDepartment.description && (
                    <p className="text-xs text-muted-foreground">
                      {mostUsedDepartment.description}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No departments have operations assigned yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Department Health */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Department Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active Rate</span>
                  <Badge
                    variant={
                      activeDepartments === totalDepartments
                        ? "default"
                        : "secondary"
                    }
                  >
                    {totalDepartments > 0
                      ? Math.round((activeDepartments / totalDepartments) * 100)
                      : 0}
                    %
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg Operations per Dept</span>
                  <Badge variant="outline">
                    {totalDepartments > 0
                      ? Math.round(totalOperations / totalDepartments)
                      : 0}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {activeDepartments === totalDepartments
                    ? "All departments are active"
                    : `${inactiveDepartments} department${
                        inactiveDepartments !== 1 ? "s" : ""
                      } need${inactiveDepartments === 1 ? "s" : ""} attention`}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
