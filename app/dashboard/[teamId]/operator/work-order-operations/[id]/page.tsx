"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@stackframe/stack";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { ActiveWOO } from "@/components/work-orders/active-woo";
import {
  Clock,
  Play,
  Pause,
  CheckCircle,
  ArrowLeft,
  FileText,
  Paperclip,
  BarChart3,
  Timer,
  AlertCircle,
} from "lucide-react";
import { WOOWithRelations } from "@/lib/services/work-order-operations";

export default function WorkOrderOperationDetailPage() {
  const params = useParams<{ teamId: string; id: string }>();
  const router = useRouter();
  const user = useUser({ or: "redirect" });
  const [woo, setWoo] = useState<WOOWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchWOO();
  }, [params.id]);

  const fetchWOO = async () => {
    try {
      const response = await fetch(`/api/work-order-operations/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch work order operation");

      const data = await response.json();
      setWoo(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load work order operation"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!woo) return;

    setActionLoading("start");
    try {
      const response = await fetch(
        `/api/work-order-operations/${woo.id}/start`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Failed to start work order operation");

      const updatedWoo = await response.json();
      setWoo(updatedWoo);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to start work order operation"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handlePause = async () => {
    if (!woo) return;

    setActionLoading("pause");
    try {
      const response = await fetch(
        `/api/work-order-operations/${woo.id}/pause`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reasonId: "manual-pause", // You might want to add a pause reason dialog
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to pause work order operation");

      const updatedWoo = await response.json();
      setWoo(updatedWoo);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to pause work order operation"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async () => {
    if (!woo) return;

    setActionLoading("resume");
    try {
      const response = await fetch(
        `/api/work-order-operations/${woo.id}/resume`,
        {
          method: "POST",
        }
      );

      if (!response.ok)
        throw new Error("Failed to resume work order operation");

      const updatedWoo = await response.json();
      setWoo(updatedWoo);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to resume work order operation"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async () => {
    if (!woo) return;

    setActionLoading("complete");
    try {
      const response = await fetch(
        `/api/work-order-operations/${woo.id}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            capturedData: null,
            quantityCompleted: 0,
            quantityRejected: 0,
            notes: null,
          }),
        }
      );

      if (!response.ok)
        throw new Error("Failed to complete work order operation");

      const updatedWoo = await response.json();
      setWoo(updatedWoo);

      // Navigate back to operator dashboard after completion
      setTimeout(() => {
        router.push(`/dashboard/${params.teamId}/operator`);
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to complete work order operation"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress":
        return "bg-green-100 text-green-800 border-green-200";
      case "paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "waiting":
        return "bg-slate-100 text-slate-800 border-slate-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Loading work order operation...
          </p>
        </div>
      </div>
    );
  }

  if (error || !woo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Error Loading Operation
          </h2>
          <p className="text-muted-foreground mb-4">
            {error || "Operation not found"}
          </p>
          <Button
            onClick={() => router.push(`/dashboard/${params.teamId}/operator`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Operator Dashboard
          </Button>
        </div>
      </div>
    );
  }

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(`/dashboard/${params.teamId}/operator`)
              }
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Queue
            </Button>
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                {woo.routingOperation.operationName}
              </h1>
              <p className="text-muted-foreground">
                Order: {woo.order.orderNumber} • Operation #
                {woo.routingOperation.operationNumber}
                {woo.routingOperation.department && (
                  <> • {woo.routingOperation.department.name}</>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <StatusIndicator
              status={
                woo.status === "in_progress"
                  ? "active"
                  : woo.status === "paused"
                  ? "warning"
                  : "pending"
              }
              label={woo.status.replace("_", " ")}
              animate={woo.status === "in_progress"}
            />
            <Badge className={getStatusColor(woo.status)}>
              {woo.status.replace("_", " ")}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {woo.status === "pending" && (
            <Button
              onClick={handleStart}
              disabled={actionLoading === "start"}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              {actionLoading === "start" ? "Starting..." : "Start Operation"}
            </Button>
          )}

          {woo.status === "in_progress" && (
            <>
              <Button
                onClick={handlePause}
                disabled={actionLoading === "pause"}
                variant="outline"
                className="bg-blue-100 hover:bg-blue-200"
              >
                <Pause className="h-4 w-4 mr-2" />
                {actionLoading === "pause" ? "Pausing..." : "Pause"}
              </Button>
              <Button
                onClick={handleComplete}
                disabled={actionLoading === "complete"}
                className="bg-green-100 hover:bg-green-200"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {actionLoading === "complete" ? "Completing..." : "Complete"}
              </Button>
            </>
          )}

          {woo.status === "paused" && (
            <Button
              onClick={handleResume}
              disabled={actionLoading === "resume"}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              {actionLoading === "resume" ? "Resuming..." : "Resume"}
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="glass-card border-0 p-1">
            <TabsTrigger
              value="details"
              className="data-[state=active]:glass-subtle data-[state=active]:text-primary"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Operation Details
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="timer"
              className="data-[state=active]:glass-subtle data-[state=active]:text-primary"
              disabled={woo.status !== "in_progress"}
            >
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Active Timer
                {woo.status === "in_progress" && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-1" />
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="attachments"
              className="data-[state=active]:glass-subtle data-[state=active]:text-primary"
            >
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="data-collection"
              className="data-[state=active]:glass-subtle data-[state=active]:text-primary"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Data Collection
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Operation Information */}
              <Card className="bento-card">
                <CardHeader>
                  <CardTitle>Operation Information</CardTitle>
                  <CardDescription>
                    Details about this operation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {woo.routingOperation.description && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Description
                      </label>
                      <p className="mt-1">{woo.routingOperation.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Setup Time
                      </label>
                      <p className="mt-1 font-medium">
                        {formatTime(woo.routingOperation.setupTime)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Run Time
                      </label>
                      <p className="mt-1 font-medium">
                        {formatTime(woo.routingOperation.runTime)}
                      </p>
                    </div>
                  </div>

                  {woo.routingOperation.tooling && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Required Tooling
                      </label>
                      <p className="mt-1">{woo.routingOperation.tooling}</p>
                    </div>
                  )}

                  {woo.routingOperation.notes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Notes
                      </label>
                      <p className="mt-1">{woo.routingOperation.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Information */}
              <Card className="bento-card">
                <CardHeader>
                  <CardTitle>Order Information</CardTitle>
                  <CardDescription>
                    Details about the work order
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Order Number
                      </label>
                      <p className="mt-1 font-medium">
                        {woo.order.orderNumber}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Priority
                      </label>
                      <Badge
                        variant={
                          woo.order.priority === "high"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {woo.order.priority}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Quantity
                      </label>
                      <p className="mt-1 font-medium">{woo.order.quantity}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Due Date
                      </label>
                      <p className="mt-1 font-medium">
                        {new Date(woo.order.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {woo.order.notes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Order Notes
                      </label>
                      <p className="mt-1">{woo.order.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timer" className="space-y-6">
            {woo.status === "in_progress" ? (
              <div className="bento-card">
                <ActiveWOO
                  woo={woo}
                  onUpdate={fetchWOO}
                  onComplete={() => {
                    fetchWOO();
                    setTimeout(
                      () => router.push(`/dashboard/${params.teamId}/operator`),
                      2000
                    );
                  }}
                />
              </div>
            ) : (
              <Card className="bento-card text-center py-16">
                <div className="w-24 h-24 rounded-full glass-subtle flex items-center justify-center mx-auto mb-6">
                  <Timer className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-muted-foreground mb-4">
                  Timer Not Active
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Start the operation to begin tracking time and monitoring
                  progress.
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="attachments" className="space-y-6">
            <Card className="bento-card">
              <CardHeader>
                <CardTitle>Operation Attachments</CardTitle>
                <CardDescription>
                  Files and documents related to this operation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Paperclip className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No Attachments
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    No files have been attached to this operation yet.
                  </p>
                  <Button variant="outline">
                    <Paperclip className="h-4 w-4 mr-2" />
                    Upload Attachment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data-collection" className="space-y-6">
            <Card className="bento-card">
              <CardHeader>
                <CardTitle>Data Collection</CardTitle>
                <CardDescription>
                  Capture production data and measurements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No Data Collection Activities
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    No data collection activities are configured for this
                    operation.
                  </p>
                  <Button variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Configure Data Collection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
