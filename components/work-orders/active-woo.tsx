"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  Pause,
  Play,
  CheckCircle,
  AlertCircle,
  FileText,
  Upload,
  Paperclip,
} from "lucide-react";
import { WOOWithRelations } from "@/lib/services/work-order-operations";
import { PauseReasonDialog } from "./pause-reason-dialog";
import { DataCollectionForm } from "@/components/data-collection/data-collection-form";
import { FileUpload } from "@/components/ui/file-upload";
import { FileList } from "@/components/ui/file-list";

interface ActiveWOOProps {
  woo: WOOWithRelations;
  onUpdate: () => void;
  onComplete: () => void;
}

interface FormField {
  name: string;
  label: string;
  type: "text" | "number" | "boolean" | "textarea";
  required?: boolean;
  placeholder?: string;
}

export function ActiveWOO({ woo, onUpdate, onComplete }: ActiveWOOProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState(woo.notes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [dataCollectionActivities, setDataCollectionActivities] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Parse data input schema
  const inputSchema: FormField[] = Array.isArray(
    woo.routingOperation.requiredSkills
  )
    ? (woo.routingOperation.requiredSkills as FormField[])
    : [];

  useEffect(() => {
    // Initialize form data with existing captured data
    if (woo.capturedData) {
      setFormData(woo.capturedData as Record<string, any>);
    }
  }, [woo.capturedData]);

  useEffect(() => {
    // Load data collection activities and attachments
    fetchDataCollectionActivities();
    fetchAttachments();
  }, [woo.id]);

  const fetchDataCollectionActivities = async () => {
    try {
      const response = await fetch(`/api/work-order-operations/${woo.id}/data-collection`);
      if (response.ok) {
        const activities = await response.json();
        setDataCollectionActivities(activities);
      }
    } catch (error) {
      console.error('Error fetching data collection activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`/api/work-order-operations/${woo.id}/attachments`);
      if (response.ok) {
        const attachmentsData = await response.json();
        setAttachments(attachmentsData);
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  useEffect(() => {
    // Calculate elapsed time
    let interval: NodeJS.Timeout | null = null;

    if (woo.status === "in_progress" && woo.actualStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const startTime = new Date(woo.actualStartTime!);

        // Calculate total elapsed time excluding pause durations
        let totalPauseTime = 0;
        if (woo.pauseEvents) {
          for (const pauseEvent of woo.pauseEvents) {
            if (pauseEvent.endTime) {
              const pauseDuration =
                new Date(pauseEvent.endTime).getTime() -
                new Date(pauseEvent.startTime).getTime();
              totalPauseTime += pauseDuration;
            }
          }
        }

        const elapsed = Math.floor(
          (now.getTime() - startTime.getTime() - totalPauseTime) / 1000
        );
        setElapsedTime(Math.max(0, elapsed));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [woo.status, woo.actualStartTime, woo.pauseEvents]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePause = async (pauseReasonId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/work-order-operations/${woo.id}/pause`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pauseReasonId }),
        }
      );

      if (!response.ok) throw new Error("Failed to pause work order");

      setShowPauseDialog(false);
      onUpdate();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to pause work order"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);

    try {
      // Save data collection first
      await saveDataCollection();

      const response = await fetch(
        `/api/work-order-operations/${woo.id}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            capturedData: formData,
            quantityCompleted: 0, // Default to 0, could be made configurable later
            quantityRejected: 0, // Default to 0, could be made configurable later
            notes: notes.trim() || undefined,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to complete work order");

      onComplete();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to complete work order"
      );
    } finally {
      setLoading(false);
    }
  };

  const saveDataCollection = async () => {
    if (Object.keys(formData).length === 0) return;

    const response = await fetch(`/api/work-order-operations/${woo.id}/data-collection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectedData: formData })
    });

    if (!response.ok) {
      throw new Error('Failed to save data collection');
    }
  };

  const handleFileUpload = (file: any) => {
    setAttachments(prev => [...prev, file]);
  };

  const handleDataCollectionSubmit = (data: Record<string, any>) => {
    setFormData(data);
  };

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const renderFormField = (field: FormField) => {
    const value = formData[field.name] || "";

    switch (field.type) {
      case "text":
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="text"
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        );

      case "number":
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={value}
              onChange={(e) =>
                handleInputChange(field.name, parseFloat(e.target.value) || "")
              }
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        );

      case "boolean":
        return (
          <div key={field.name} className="flex items-center space-x-2">
            <input
              id={field.name}
              type="checkbox"
              checked={value === true}
              onChange={(e) => handleInputChange(field.name, e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        );

      case "textarea":
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={3}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const getTimerColor = () => {
    const targetSeconds = (woo.routingOperation.runTime || 0) * 60;
    if (targetSeconds === 0) return "text-blue-600";

    const percentage = (elapsedTime / targetSeconds) * 100;
    if (percentage > 120) return "text-red-600";
    if (percentage > 100) return "text-orange-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Header with Timer */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {woo.routingOperation.operationName}
              </CardTitle>
              <CardDescription>
                Order: {woo.order.orderNumber} • Operation #
                {woo.routingOperation.operationNumber}
                {woo.routingOperation.department && (
                  <> • {woo.routingOperation.department.name}</>
                )}
              </CardDescription>
            </div>
            <div className="text-right">
              <div
                className={`text-3xl font-mono font-bold ${getTimerColor()}`}
              >
                {formatDuration(elapsedTime)}
              </div>
              <div className="text-sm text-gray-600">
                Target:{" "}
                {formatDuration((woo.routingOperation.runTime || 0) * 60)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge
              variant={woo.status === "in_progress" ? "default" : "secondary"}
            >
              {woo.status.replace("_", " ")}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              Setup:{" "}
              {formatDuration((woo.routingOperation.setupTime || 0) * 60)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      {woo.routingOperation.instructions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">
                {woo.routingOperation.instructions}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Collection Forms */}
      {!loadingActivities && (
        <DataCollectionForm
          activities={dataCollectionActivities}
          wooId={woo.id}
          onSubmit={handleDataCollectionSubmit}
          initialData={formData}
        />
      )}

      {/* File Attachments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Attachments
          </CardTitle>
          <CardDescription>
            Upload files related to this operation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUpload
            onUpload={handleFileUpload}
            wooId={woo.id}
            attachmentType="operator"
          />
          {attachments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Uploaded Files</h4>
              <FileList files={attachments} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes</CardTitle>
          <CardDescription>
            Add any observations, issues, or comments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter notes about this operation..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setShowPauseDialog(true)}
          disabled={loading || woo.status !== "in_progress"}
        >
          <Pause className="h-4 w-4 mr-2" />
          Pause
        </Button>

        <Button
          onClick={handleComplete}
          disabled={loading || woo.status !== "in_progress"}
          className="flex-1"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Complete Operation
        </Button>
      </div>

      {/* Pause Reason Dialog */}
      <PauseReasonDialog
        open={showPauseDialog}
        onOpenChange={setShowPauseDialog}
        onConfirm={handlePause}
        loading={loading}
      />
    </div>
  );
}
