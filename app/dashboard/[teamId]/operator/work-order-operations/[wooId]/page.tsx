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
  Download,
  User,
  Upload,
  Eye,
  ShoppingCart,
} from "lucide-react";
import { WOOWithRelations } from "@/lib/services/work-order-operations";
import { FileUpload } from "@/components/ui/file-upload";
import { FileList } from "@/components/ui/file-list";
import { DataCollectionForm } from "@/components/data-collection/data-collection-form";

export default function WorkOrderOperationDetailPage() {
  const params = useParams<{ teamId: string; wooId: string }>();
  const router = useRouter();
  const user = useUser({ or: "redirect" });
  const [woo, setWoo] = useState<WOOWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [dataCollectionActivities, setDataCollectionActivities] = useState<any[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    fetchWOO();
    fetchAttachments();
    fetchDataCollectionActivities();
  }, [params.wooId]);

  const fetchWOO = async () => {
    try {
      const response = await fetch(`/api/work-order-operations/${params.wooId}`);
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

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`/api/work-order-operations/${params.wooId}/attachments`);
      if (response.ok) {
        const data = await response.json();
        setAttachments(data);
      }
    } catch (err) {
      console.error('Error fetching attachments:', err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const fetchDataCollectionActivities = async () => {
    try {
      const response = await fetch(`/api/work-order-operations/${params.wooId}/data-collection`);
      if (response.ok) {
        const data = await response.json();
        setDataCollectionActivities(data);
      }
    } catch (err) {
      console.error('Error fetching data collection activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleFileUpload = (file: any) => {
    setAttachments(prev => [...prev, file]);
  };

  const handleDataCollectionSubmit = (data: Record<string, any>) => {
    // Save data collection
    fetch(`/api/work-order-operations/${params.wooId}/data-collection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectedData: data })
    });
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

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Header - Optimized for Mobile */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
            <Button
              variant="outline"
              size="lg"
              onClick={() =>
                router.push(`/dashboard/${params.teamId}/operator`)
              }
              className="min-h-12 text-base font-medium"
            >
              <ArrowLeft className="h-5 w-5 mr-3" />
              Back to Queue
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
                {woo.routingOperation.operationName}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Order: {woo.order.orderNumber} • Operation #
                {woo.routingOperation.operationNumber}
                {woo.routingOperation.department && (
                  <> • {woo.routingOperation.department.name}</>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            <Badge
              variant={woo.status === "in_progress" ? "active" : woo.status === "paused" ? "paused" : "pending"}
              className="text-base px-3 py-1"
            >
              {woo.status.replace("_", " ")}
            </Badge>
          </div>
        </div>

        {/* Action Buttons - Optimized for Touch */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {woo.status === "pending" && (
            <Button
              onClick={handleStart}
              disabled={actionLoading === "start"}
              className="bg-green-600 hover:bg-green-700 min-h-12 text-base font-medium"
              size="lg"
            >
              <Play className="h-5 w-5 mr-3" />
              {actionLoading === "start" ? "Starting..." : "Start Operation"}
            </Button>
          )}

          {woo.status === "in_progress" && (
            <>
              <Button
                onClick={handlePause}
                disabled={actionLoading === "pause"}
                variant="outline"
                className="bg-blue-300 hover:bg-blue-400 min-h-12 text-base font-medium"
                size="lg"
              >
                <Pause className="h-5 w-5 mr-3" />
                {actionLoading === "pause" ? "Pausing..." : "Pause"}
              </Button>
              <Button
                onClick={handleComplete}
                disabled={actionLoading === "complete"}
                className="bg-green-600 hover:bg-green-700 min-h-12 text-base font-medium"
                size="lg"
              >
                <CheckCircle className="h-5 w-5 mr-3" />
                {actionLoading === "complete" ? "Completing..." : "Complete"}
              </Button>
            </>
          )}

          {woo.status === "paused" && (
            <Button
              onClick={handleResume}
              disabled={actionLoading === "resume"}
              className="bg-green-600 hover:bg-green-700 min-h-12 text-base font-medium"
              size="lg"
            >
              <Play className="h-5 w-5 mr-3" />
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

        {/* Main Content - Single Page Layout */}
        <div className="space-y-8">
          {/* Active Timer Section - Most Prominent */}
          {woo.status === "in_progress" && (
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
          )}

          {/* Operation & Order Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Operation Information */}
            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Operation Information
                </CardTitle>
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

                {(woo.routingOperation as any).tooling && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Required Tooling
                    </label>
                    <p className="mt-1">{(woo.routingOperation as any).tooling}</p>
                  </div>
                )}

                {(woo.routingOperation as any).notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Notes
                    </label>
                    <p className="mt-1">{(woo.routingOperation as any).notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Information */}
            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Information
                </CardTitle>
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
                        woo.order.priority >= 3
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
                      {woo.order.scheduledStartDate ? new Date(woo.order.scheduledStartDate).toLocaleDateString() : 'Not scheduled'}
                    </p>
                  </div>
                </div>

                {(woo.order as any).notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Order Notes
                    </label>
                    <p className="mt-1">{(woo.order as any).notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Data Collection Section */}
          {loadingActivities ? (
            <Card className="bento-card">
              <CardContent className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading data collection activities...</p>
              </CardContent>
            </Card>
          ) : dataCollectionActivities.length > 0 ? (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Data Collection
              </h2>
              <DataCollectionForm
                activities={dataCollectionActivities}
                wooId={params.wooId}
                onSubmit={handleDataCollectionSubmit}
              />
            </div>
          ) : null}

          {/* Attachments Section */}
          <Card className="bento-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Attachments & Files
              </CardTitle>
              <CardDescription>
                Work instructions, reference materials, and operator uploads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Routing Operation Attachments */}
              {(woo?.routingOperation as any)?.fileAttachments && (woo.routingOperation as any).fileAttachments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Work Instructions & Reference Materials
                  </h4>
                  <div className="grid gap-4">
                    {(woo.routingOperation as any).fileAttachments.map((file: any) => (
                      <Card key={file.id} className="border-blue-200 bg-blue-50/50">
                        <CardContent className="p-4">
                          {file.mimeType.startsWith('image/') ? (
                            <div className="space-y-3">
                              <img
                                src={file.url}
                                alt={file.originalName}
                                className="max-w-full h-64 object-contain rounded-md border mx-auto"
                              />
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{file.originalName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(file.uploadedAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => window.open(file.url, '_blank')}
                                    className="min-h-10 text-base"
                                  >
                                    <Eye className="h-5 w-5 mr-2" />
                                    View Full Size
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : file.mimeType === 'application/pdf' ? (
                            <div className="space-y-3">
                              <div className="border rounded-md p-6 bg-red-50 text-center">
                                <FileText className="h-16 w-16 text-red-600 mx-auto mb-3" />
                                <p className="font-medium">{file.originalName}</p>
                                <p className="text-sm text-muted-foreground">PDF Document</p>
                              </div>
                              <div className="flex flex-col sm:flex-row justify-center gap-3">
                                <Button
                                  size="lg"
                                  onClick={() => window.open(file.url, '_blank')}
                                  className="min-h-12 text-base font-medium"
                                >
                                  <Eye className="h-5 w-5 mr-2" />
                                  View PDF
                                </Button>
                                <Button
                                  size="lg"
                                  variant="outline"
                                  onClick={() => {
                                    const link = document.createElement('a')
                                    link.href = file.url
                                    link.download = file.originalName
                                    link.click()
                                  }}
                                  className="min-h-12 text-base font-medium"
                                >
                                  <Download className="h-5 w-5 mr-2" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{file.originalName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(file.uploadedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="lg"
                                variant="outline"
                                onClick={() => {
                                  const link = document.createElement('a')
                                  link.href = file.url
                                  link.download = file.originalName
                                  link.click()
                                }}
                                className="min-h-10 text-base"
                              >
                                <Download className="h-5 w-5 mr-2" />
                                Download
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Operator Upload Section */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Additional Files
                </h4>
                <FileUpload
                  onUpload={handleFileUpload}
                  wooId={params.wooId}
                  attachmentType="operator"
                />
              </div>

              {/* Operator Uploaded Files */}
              {loadingAttachments ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading attachments...</p>
                </div>
              ) : attachments.length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Your Uploaded Files
                  </h4>
                  <FileList files={attachments} />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Paperclip className="h-8 w-8 mx-auto mb-2" />
                  <p>No additional files uploaded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
