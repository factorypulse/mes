"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Power,
  PowerOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DepartmentsTable } from "./departments-table";
import { DepartmentForm } from "./department-form";
import { DeleteDepartmentDialog } from "./delete-department-dialog";
import { DepartmentStats } from "./department-stats";

export interface Department {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    routingOperations: number;
  };
}

interface DepartmentsTabProps {
  teamId: string;
}

export function DepartmentsTab({ teamId }: DepartmentsTabProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null
  );
  const [deletingDepartment, setDeletingDepartment] =
    useState<Department | null>(null);
  const [bulkActionsLoading, setBulkActionsLoading] = useState(false);

  // Filter departments based on search term
  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dept.description &&
        dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/departments?teamId=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      } else {
        console.error("Failed to fetch departments");
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Create department
  const handleCreateDepartment = async (data: {
    name: string;
    description?: string;
  }) => {
    try {
      const response = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, teamId }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        fetchDepartments();
      } else {
        console.error("Failed to create department");
      }
    } catch (error) {
      console.error("Error creating department:", error);
    }
  };

  // Update department
  const handleUpdateDepartment = async (
    id: string,
    data: { name: string; description?: string }
  ) => {
    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setEditingDepartment(null);
        fetchDepartments();
      } else {
        console.error("Failed to update department");
      }
    } catch (error) {
      console.error("Error updating department:", error);
    }
  };

  // Delete department
  const handleDeleteDepartment = async (id: string) => {
    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDeletingDepartment(null);
        fetchDepartments();
      } else {
        const error = await response.json();
        console.error("Failed to delete department:", error.error);
        // TODO: Show error toast
      }
    } catch (error) {
      console.error("Error deleting department:", error);
    }
  };

  // Bulk operations
  const handleBulkAction = async (action: "activate" | "deactivate") => {
    if (selectedDepartments.length === 0) return;

    try {
      setBulkActionsLoading(true);
      const response = await fetch("/api/departments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          departmentIds: selectedDepartments,
          teamId,
        }),
      });

      if (response.ok) {
        setSelectedDepartments([]);
        fetchDepartments();
      } else {
        console.error("Failed to perform bulk action");
      }
    } catch (error) {
      console.error("Error performing bulk action:", error);
    } finally {
      setBulkActionsLoading(false);
    }
  };

  // Load departments on mount
  useEffect(() => {
    fetchDepartments();
  }, [teamId]);

  return (
    <div className="space-y-6">
      {/* Department Statistics */}
      <DepartmentStats departments={departments} />

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Bulk Actions */}
          {selectedDepartments.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedDepartments.length} selected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("activate")}
                disabled={bulkActionsLoading}
                className="flex items-center gap-2"
              >
                <Power className="h-4 w-4" />
                Activate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("deactivate")}
                disabled={bulkActionsLoading}
                className="flex items-center gap-2"
              >
                <PowerOff className="h-4 w-4" />
                Deactivate
              </Button>
            </div>
          )}
        </div>

        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </div>

      {/* Departments Table */}
      <DepartmentsTable
        departments={filteredDepartments}
        loading={loading}
        selectedDepartments={selectedDepartments}
        onSelectionChange={setSelectedDepartments}
        onEdit={setEditingDepartment}
        onDelete={setDeletingDepartment}
      />

      {/* Create Form Dialog */}
      {showCreateForm && (
        <DepartmentForm
          open={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreateDepartment}
          title="Create Department"
          submitLabel="Create Department"
        />
      )}

      {/* Edit Form Dialog */}
      {editingDepartment && (
        <DepartmentForm
          open={!!editingDepartment}
          onClose={() => setEditingDepartment(null)}
          onSubmit={(data) =>
            handleUpdateDepartment(editingDepartment.id, data)
          }
          initialData={{
            name: editingDepartment.name,
            description: editingDepartment.description || "",
          }}
          title="Edit Department"
          submitLabel="Update Department"
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingDepartment && (
        <DeleteDepartmentDialog
          open={!!deletingDepartment}
          department={deletingDepartment}
          onClose={() => setDeletingDepartment(null)}
          onConfirm={() => handleDeleteDepartment(deletingDepartment.id)}
        />
      )}
    </div>
  );
}
