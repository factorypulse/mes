"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ExternalLink, Shield } from "lucide-react";
import { WOOWithRelations } from "@/lib/services/work-order-operations";

interface OperatorDashboardProps {
  teamId: string;
  operatorId: string;
  departmentId?: string;
}

export function OperatorDashboard({
  teamId,
  operatorId,
  departmentId,
}: OperatorDashboardProps) {
  const router = useRouter();
  const [woos, setWoos] = useState<WOOWithRelations[]>([]);
  const [activeWoo, setActiveWoo] = useState<WOOWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWOOs();
    fetchActiveWOO();
  }, [teamId, departmentId]);

  const fetchWOOs = async () => {
    try {
      const params = new URLSearchParams({
        type: "operator",
      });
      if (departmentId) {
        params.append("departmentId", departmentId);
      }

      const response = await fetch(`/api/work-order-operations?${params}`);
      if (!response.ok) throw new Error("Failed to fetch work orders");

      const data = await response.json();
      setWoos(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load work orders"
      );
    }
  };

  const fetchActiveWOO = async () => {
    try {
      const params = new URLSearchParams({
        operatorId,
        status: "in_progress",
      });

      const response = await fetch(`/api/work-order-operations?${params}`);
      if (!response.ok) throw new Error("Failed to fetch active work order");

      const data = await response.json();
      setActiveWoo(data.length > 0 ? data[0] : null);
    } catch (err) {
      // No active WOO is fine
      setActiveWoo(null);
    } finally {
      setLoading(false);
    }
  };

  const openWOODetail = (wooId: string) => {
    router.push(`/dashboard/${teamId}/operator/work-order-operations/${wooId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "in_progress":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "paused":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "waiting":
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const formatTime = (minutes?: number | null) => {
    if (!minutes) return "Not set";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading work orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Active Work Order */}
      {activeWoo && (
        <Card
          className="border-l-4 border-l-green-500"
          onClick={() => openWOODetail(activeWoo.id)}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Active Work Order</CardTitle>
                <CardDescription>Currently in progress</CardDescription>
              </div>
              <div className="flex flex-col items-center gap-4">
              <Badge className={getStatusColor(activeWoo.status)}>
                {activeWoo.status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
              </Badge>
    <Button
                  size="lg"
                  onClick={() => openWOODetail(activeWoo.id)}
                  className="min-h-12 px-6 font-medium"
                >
                  Open
                </Button>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">
                  {activeWoo.routingOperation.operationName}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Order: {activeWoo.order.orderNumber} • Op #
                  {activeWoo.routingOperation.operationNumber}
                </p>
              </div>

              {activeWoo.routingOperation.description && (
                <p className="text-sm">
                  {activeWoo.routingOperation.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Setup: {formatTime(activeWoo.routingOperation.setupTime)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Run: {formatTime(activeWoo.routingOperation.runTime)}
                </div>
              </div>

              <div className="flex gap-2">

              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Work Orders */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Work Orders</h2>

        {woos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Work Orders Available
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-1">
                No work orders are currently available for your departments
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Work orders are filtered based on your department access.
                Contact your supervisor if you need access to additional
                departments.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {woos.map((woo) => (
              <Card
                key={woo.id}
                className="hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/30"
                onClick={() => openWOODetail(woo.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">
                          {woo.routingOperation.operationName}
                        </h3>
                        <Badge className={getStatusColor(woo.status)}>
                          {woo.status.replace("_", " ")}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        Order: {woo.order.orderNumber} • Op #
                        {woo.routingOperation.operationNumber}
                        {woo.routingOperation.department && (
                          <>
                            {" "}
                            •{" "}
                            <span className="font-medium text-primary">
                              {woo.routingOperation.department.name}
                            </span>
                          </>
                        )}
                      </p>

                      {woo.routingOperation.description && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          {woo.routingOperation.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Setup: {formatTime(woo.routingOperation.setupTime)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Run: {formatTime(woo.routingOperation.runTime)}
                        </div>
                        <div>Priority: {woo.order.priority}</div>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <Button
                        size="lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          openWOODetail(woo.id);
                        }}
                        className="min-h-12 px-6 font-medium"
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
