"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Building2,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Department } from "./departments-tab";

interface DepartmentsTableProps {
  departments: Department[];
  loading: boolean;
  selectedDepartments: string[];
  onSelectionChange: (selected: string[]) => void;
  onEdit: (department: Department) => void;
  onDelete: (department: Department) => void;
}

type SortField = "name" | "createdAt" | "operationsCount";
type SortDirection = "asc" | "desc";

export function DepartmentsTable({
  departments,
  loading,
  selectedDepartments,
  onSelectionChange,
  onEdit,
  onDelete,
}: DepartmentsTableProps) {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort departments
  const sortedDepartments = [...departments].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "createdAt":
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case "operationsCount":
        aValue = a._count?.routingOperations || 0;
        bValue = b._count?.routingOperations || 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(departments.map((dept) => dept.id));
    } else {
      onSelectionChange([]);
    }
  };

  // Handle individual selection
  const handleSelectDepartment = (departmentId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedDepartments, departmentId]);
    } else {
      onSelectionChange(
        selectedDepartments.filter((id) => id !== departmentId)
      );
    }
  };

  // Check if all are selected
  const allSelected =
    departments.length > 0 && selectedDepartments.length === departments.length;
  const someSelected =
    selectedDepartments.length > 0 &&
    selectedDepartments.length < departments.length;

  if (loading) {
    return (
      <div className="rounded-md border">
        <div className="p-4">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Departments Found</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Create your first department to start organizing your operations.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                ref={(ref) => {
                  if (ref) {
                    (ref as any).indeterminate = someSelected;
                  }
                }}
              />
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("name")}
                className="h-auto p-0 font-medium hover:bg-transparent"
              >
                Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("operationsCount")}
                className="h-auto p-0 font-medium hover:bg-transparent"
              >
                Operations
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("createdAt")}
                className="h-auto p-0 font-medium hover:bg-transparent"
              >
                Created
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDepartments.map((department) => (
            <TableRow key={department.id}>
              <TableCell>
                <Checkbox
                  checked={selectedDepartments.includes(department.id)}
                  onCheckedChange={(checked) =>
                    handleSelectDepartment(department.id, checked as boolean)
                  }
                />
              </TableCell>
              <TableCell className="font-medium">{department.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {department.description || "—"}
              </TableCell>
              <TableCell>
                <Badge variant={department.isActive ? "default" : "secondary"}>
                  {department.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {department._count?.routingOperations || 0} operations
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(department.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" >
                    <DropdownMenuItem onClick={() => onEdit(department)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(department)}
                      className="text-destructive"
                      disabled={(department._count?.routingOperations ?? 0) > 0}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
