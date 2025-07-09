"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2 } from "lucide-react";

interface PauseReason {
  id: string;
  name: string;
  description?: string;
  category: string;
}

interface PauseReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (pauseReasonId: string) => void;
  loading?: boolean;
}

const categoryColors: Record<string, string> = {
  planned: "bg-blue-100 text-blue-800",
  unplanned: "bg-red-100 text-red-800",
  maintenance: "bg-purple-100 text-purple-800",
  quality: "bg-orange-100 text-orange-800",
  material: "bg-green-100 text-green-800",
  other: "bg-gray-100 text-gray-800",
};

const categoryLabels: Record<string, string> = {
  planned: "Planned",
  unplanned: "Unplanned",
  maintenance: "Maintenance",
  quality: "Quality",
  material: "Material",
  other: "Other",
};

export function PauseReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: PauseReasonDialogProps) {
  const [pauseReasons, setPauseReasons] = useState<PauseReason[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchPauseReasons();
      setSelectedReasonId(null);
      setError(null);
    }
  }, [open]);

  const fetchPauseReasons = async () => {
    setFetchLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/pause-reasons?activeOnly=true");
      if (!response.ok) throw new Error("Failed to fetch pause reasons");

      const data = await response.json();
      setPauseReasons(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load pause reasons"
      );
    } finally {
      setFetchLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedReasonId) {
      onConfirm(selectedReasonId);
    }
  };

  const groupedReasons = pauseReasons.reduce((acc, reason) => {
    if (!acc[reason.category]) {
      acc[reason.category] = [];
    }
    acc[reason.category].push(reason);
    return acc;
  }, {} as Record<string, PauseReason[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pause Work Order</DialogTitle>
          <DialogDescription>
            Select a reason for pausing this work order operation. This helps
            track downtime and identify improvement opportunities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {fetchLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading pause reasons...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedReasons).map(([category, reasons]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      className={
                        categoryColors[category] || categoryColors.other
                      }
                    >
                      {categoryLabels[category] || category}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      ({reasons.length} reason{reasons.length !== 1 ? "s" : ""})
                    </span>
                  </div>

                  <div className="grid gap-2">
                    {reasons.map((reason) => (
                      <Card
                        key={reason.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedReasonId === reason.id
                            ? "ring-2 ring-blue-500 bg-blue-50"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedReasonId(reason.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{reason.name}</h4>
                              {reason.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {reason.description}
                                </p>
                              )}
                            </div>
                            {selectedReasonId === reason.id && (
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center ml-2 mt-0.5">
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}

              {pauseReasons.length === 0 && !fetchLoading && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No pause reasons available</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Contact your administrator to set up pause reasons
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedReasonId || loading || fetchLoading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Pause Work Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
