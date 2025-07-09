"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@stackframe/stack";
import { OperatorDashboard } from "@/components/work-orders/operator-dashboard";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { User, Timer } from "lucide-react";

interface DepartmentAccess {
  allDepartments: boolean;
  specificDepartments: string[];
}

interface UserWithAccess {
  departmentAccess: DepartmentAccess;
  departments?: Array<{ id: string; name: string }>;
}

export default function OperatorPage() {
  const params = useParams<{ teamId: string }>();
  const user = useUser({ or: "redirect" });
  const [refreshKey, setRefreshKey] = useState(0);
  const [userAccess, setUserAccess] = useState<UserWithAccess | null>(null);
  const [loadingAccess, setLoadingAccess] = useState(true);

  // Mock data for operator metrics
  const operatorStats = {
    todayEfficiency: 94.2,
    tasksCompleted: 12,
    qualityScore: 98.5,
    activeTime: 6.5, // hours
  };

  useEffect(() => {
    fetchUserAccess();
  }, [params.teamId, user.id]);

  const fetchUserAccess = async () => {
    try {
      const response = await fetch(
        `/api/users/${user.id}?teamId=${params.teamId}`
      );
      if (response.ok) {
        const userData = await response.json();
        setUserAccess(userData);
      }
    } catch (error) {
      console.error("Error fetching user access:", error);
    } finally {
      setLoadingAccess(false);
    }
  };

  const handleWooUpdate = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const formatTimeOnShift = () => {
    const now = new Date();
    const shiftStart = new Date();
    shiftStart.setHours(7, 0, 0, 0); // Assuming 7 AM shift start

    const hours = Math.floor(
      (now.getTime() - shiftStart.getTime()) / (1000 * 60 * 60)
    );
    const minutes = Math.floor(
      ((now.getTime() - shiftStart.getTime()) % (1000 * 60 * 60)) / (1000 * 60)
    );

    return `${hours}h ${minutes}m`;
  };

  const getAccessLevelDisplay = () => {
    if (loadingAccess) return "Loading...";
    if (!userAccess) return "No Access";

    if (userAccess.departmentAccess.allDepartments) {
      return "All Departments";
    }

    if (userAccess.departments && userAccess.departments.length > 0) {
      return userAccess.departments.length === 1
        ? userAccess.departments[0].name
        : `${userAccess.departments.length} Departments`;
    }

    return "No Access";
  };

  return (
    <div className="min-h-screen">
      {/* Ambient background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-green-500/5 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" />
        <div
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"
          style={{ animationDelay: "3s" }}
        />
      </div>

      <div className="relative z-10 p-8 space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Operator Workflow
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your work orders and track real-time progress
            </p>
          </div>
          <div className="flex items-center gap-4">
            <StatusIndicator
              status="pending"
              label="Ready for Work"
              animate={false}
            />
          </div>
        </div>

        {/* Operator Info Card */}
        <div className="bento-card bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl glass-subtle">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {user.displayName || "Operator"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {user.primaryEmail}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text">
                  {formatTimeOnShift()}
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Time on Shift
                </p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold gradient-text">
                  {getAccessLevelDisplay()}
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Access Level
                </p>
                {userAccess &&
                  userAccess.departments &&
                  userAccess.departments.length > 1 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {userAccess.departments
                        .map((dept) => dept.name)
                        .join(", ")}
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          <div className="bento-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold mb-1">
                  Available Work Orders
                </h3>
                <p className="text-sm text-muted-foreground">
                  {userAccess?.departmentAccess.allDepartments
                    ? "Showing work orders from all departments"
                    : userAccess?.departments &&
                      userAccess.departments.length > 0
                    ? `Showing work orders from your ${
                        userAccess.departments.length === 1
                          ? "department"
                          : "departments"
                      }`
                    : "No department access assigned"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-500">
                  Real-time Queue
                </span>
              </div>
            </div>

            <OperatorDashboard
              key={refreshKey}
              teamId={params.teamId}
              operatorId={user.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
