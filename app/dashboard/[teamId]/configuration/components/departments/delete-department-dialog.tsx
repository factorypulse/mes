"use client";

import { useState } from "react";
import { AlertTriangle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Department } from "./departments-tab";

interface DeleteDepartmentDialogProps {
  open: boolean;
  department: Department;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteDepartmentDialog({
  open,
  department,
  onClose,
  onConfirm,
}: DeleteDepartmentDialogProps) {
  const [loading, setLoading] = useState(false);

  const operationsCount = department._count?.routingOperations || 0;
  const canDelete = operationsCount === 0;

  const handleConfirm = async () => {
    if (!canDelete) return;

    setLoading(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Error deleting department:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Department
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the
            department.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Department Info */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{department.name}</span>
              <Badge variant={department.isActive ? "default" : "secondary"}>
                {department.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            {department.description && (
              <p className="text-sm text-muted-foreground">
                {department.description}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Badge variant="outline">{operationsCount} operations</Badge>
            </div>
          </div>

          {/* Warning Message */}
          {!canDelete ? (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">
                    Cannot Delete Department
                  </p>
                  <p className="text-sm text-destructive/80">
                    This department cannot be deleted because it has{" "}
                    {operationsCount} operation
                    {operationsCount !== 1 ? "s" : ""} assigned to it. You must
                    first remove or reassign these operations before deleting
                    the department.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Ready to Delete</p>
                  <p className="text-sm text-muted-foreground">
                    This department has no operations assigned and can be safely
                    deleted.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canDelete || loading}
          >
            {loading ? "Deleting..." : "Delete Department"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
