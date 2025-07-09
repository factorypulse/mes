"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Play, Pause, RotateCcw } from "lucide-react";
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

  const startWOO = async (wooId: string) => {
    try {
      const response = await fetch(
        `/api/work-order-operations/${wooId}/start`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Failed to start work order");

      const startedWoo = await response.json();
      setActiveWoo(startedWoo);
      await fetchWOOs(); // Refresh list
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start work order"
      );
    }
  };

  const resumeWOO = async (wooId: string) => {
    try {
      const response = await fetch(
        `/api/work-order-operations/${wooId}/resume`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Failed to resume work order");

      const resumedWoo = await response.json();
      setActiveWoo(resumedWoo);
      await fetchWOOs(); // Refresh list
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to resume work order"
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading work orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Active Work Order */}
      {activeWoo && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Active Work Order</CardTitle>
                <CardDescription>Currently in progress</CardDescription>
              </div>
              <Badge className={getStatusColor(activeWoo.status)}>
                {activeWoo.status.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">
                  {activeWoo.routingOperation.operationName}
                </h4>
                <p className="text-sm text-gray-600">
                  Order: {activeWoo.order.orderNumber} • Op #
                  {activeWoo.routingOperation.operationNumber}
                </p>
              </div>

              {activeWoo.routingOperation.description && (
                <p className="text-sm">
                  {activeWoo.routingOperation.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-600">
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
                <Button size="sm" variant="outline">
                  View Details
                </Button>
                <Button size="sm" variant="outline">
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
                <Button size="sm">Complete</Button>
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
            <CardContent className="text-center py-8">
              <p className="text-gray-600">No work orders available</p>
              <p className="text-sm text-gray-500 mt-1">
                Check back later or contact your supervisor
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {woos.map((woo) => (
              <Card key={woo.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">
                          {woo.routingOperation.operationName}
                        </h3>
                        <Badge className={getStatusColor(woo.status)}>
                          {woo.status.replace("_", " ")}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        Order: {woo.order.orderNumber} • Op #
                        {woo.routingOperation.operationNumber}
                        {woo.routingOperation.department && (
                          <> • {woo.routingOperation.department.name}</>
                        )}
                      </p>

                      {woo.routingOperation.description && (
                        <p className="text-sm text-gray-700 mb-2">
                          {woo.routingOperation.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-600">
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

                    <div className="flex gap-2 ml-4">
                      {woo.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => startWOO(woo.id)}
                          disabled={!!activeWoo}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {woo.status === "paused" && (
                        <Button
                          size="sm"
                          onClick={() => resumeWOO(woo.id)}
                          disabled={!!activeWoo}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Resume
                        </Button>
                      )}
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
