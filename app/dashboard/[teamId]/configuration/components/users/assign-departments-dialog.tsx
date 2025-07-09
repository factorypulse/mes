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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Building2, Globe, User, AlertCircle, CheckCircle } from "lucide-react";
import {
  UserWithDepartmentAccess,
  DepartmentAccess,
} from "@/lib/services/users";

interface AssignDepartmentsDialogProps {
  user: UserWithDepartmentAccess;
  departments: { id: string; name: string }[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function AssignDepartmentsDialog({
  user,
  departments,
  isOpen,
  onClose,
  onComplete,
}: AssignDepartmentsDialogProps) {
  const [allDepartments, setAllDepartments] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with current user's department access
  useEffect(() => {
    if (user) {
      setAllDepartments(user.departmentAccess.allDepartments);
      setSelectedDepartments(user.departmentAccess.specificDepartments || []);
      setError(null);
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const departmentAccess: DepartmentAccess = {
        allDepartments,
        specificDepartments: allDepartments ? [] : selectedDepartments,
      };

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ departmentAccess }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to update department access"
        );
      }

      onComplete();
    } catch (error) {
      console.error("Error updating department access:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentToggle = (departmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDepartments((prev) => [...prev, departmentId]);
    } else {
      setSelectedDepartments((prev) =>
        prev.filter((id) => id !== departmentId)
      );
    }
  };

  const handleAllDepartmentsChange = (checked: boolean) => {
    setAllDepartments(checked);
    if (checked) {
      setSelectedDepartments([]);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setAllDepartments(user.departmentAccess.allDepartments);
    setSelectedDepartments(user.departmentAccess.specificDepartments || []);
    setError(null);
    onClose();
  };

  const hasChanges = () => {
    return (
      allDepartments !== user.departmentAccess.allDepartments ||
      JSON.stringify(selectedDepartments.sort()) !==
        JSON.stringify((user.departmentAccess.specificDepartments || []).sort())
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Assign Department Access
          </DialogTitle>
          <DialogDescription>
            Configure which departments this user can access
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <Avatar className="h-10 w-10">
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.displayName || "User"}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-muted rounded-full">
                  <span className="text-sm font-medium">
                    {user.displayName?.[0] || user.primaryEmail?.[0] || "U"}
                  </span>
                </div>
              )}
            </Avatar>
            <div>
              <div className="font-medium">
                {user.displayName || "Unnamed User"}
              </div>
              <div className="text-sm text-muted-foreground">
                {user.primaryEmail}
              </div>
            </div>
          </div>

          {/* All Departments Option */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="all-departments"
                checked={allDepartments}
                onCheckedChange={handleAllDepartmentsChange}
              />
              <Label
                htmlFor="all-departments"
                className="flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                Access to all departments
              </Label>
            </div>

            {allDepartments && (
              <div className="pl-6">
                <Badge
                  variant="default"
                  className="flex items-center gap-1 w-fit"
                >
                  <CheckCircle className="h-3 w-3" />
                  Full Access
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  User will have access to all current and future departments
                </p>
              </div>
            )}
          </div>

          {/* Specific Departments */}
          {!allDepartments && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Specific departments
              </Label>

              {departments.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 border rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  No departments available. Create departments first.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {departments.map((department) => (
                    <div
                      key={department.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`dept-${department.id}`}
                        checked={selectedDepartments.includes(department.id)}
                        onCheckedChange={(checked) =>
                          handleDepartmentToggle(
                            department.id,
                            Boolean(checked)
                          )
                        }
                      />
                      <Label
                        htmlFor={`dept-${department.id}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {department.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {!allDepartments && selectedDepartments.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  User will have no department access
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !hasChanges()}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
