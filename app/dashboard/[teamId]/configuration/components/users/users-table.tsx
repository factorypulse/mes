"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Settings,
  UserMinus,
  Building2,
  Globe,
  Calendar,
  Mail,
} from "lucide-react";
import { format } from "date-fns";
import { UserWithDepartmentAccess } from "@/lib/services/users";
import { AssignDepartmentsDialog } from "./assign-departments-dialog";

interface UsersTableProps {
  teamId: string;
}

export function UsersTable({ teamId }: UsersTableProps) {
  const [users, setUsers] = useState<UserWithDepartmentAccess[]>([]);
  const [departments, setDepartments] = useState<
    { id: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] =
    useState<UserWithDepartmentAccess | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, [teamId]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`/api/departments?teamId=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      } else {
        console.error("Failed to fetch departments:", response.status);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this user from the team?")) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to remove user");
      }
    } catch (error) {
      console.error("Error removing user:", error);
      alert("Failed to remove user");
    }
  };

  const handleAssignDepartments = (user: UserWithDepartmentAccess) => {
    if (departments.length === 0) {
      alert("No departments available. Create departments first.");
      return;
    }
    setSelectedUser(user);
    setIsAssignDialogOpen(true);
  };

  const handleAssignmentComplete = () => {
    fetchUsers();
    setIsAssignDialogOpen(false);
    setSelectedUser(null);
  };

  const getDepartmentNames = (user: UserWithDepartmentAccess): string[] => {
    if (user.departmentAccess.allDepartments) {
      return ["All Departments"];
    }

    if (user.departmentAccess.specificDepartments.length === 0) {
      return ["No Access"];
    }

    return user.departmentAccess.specificDepartments.map(
      (deptId) => departments.find((d) => d.id === deptId)?.name || "Unknown"
    );
  };

  const getAccessBadgeVariant = (user: UserWithDepartmentAccess) => {
    if (user.departmentAccess.allDepartments) {
      return "default";
    }
    if (user.departmentAccess.specificDepartments.length === 0) {
      return "secondary";
    }
    return "outline";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department Access</TableHead>
              <TableHead>Member Since</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No team members found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const departmentNames = getDepartmentNames(user);
                const badgeVariant = getAccessBadgeVariant(user);

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
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
                                {user.displayName?.[0] ||
                                  user.primaryEmail?.[0] ||
                                  "U"}
                              </span>
                            </div>
                          )}
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {user.displayName || "Unnamed User"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {user.primaryEmail || "No email"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        {departmentNames.map((name, index) => (
                          <Badge
                            key={index}
                            variant={badgeVariant}
                            className="mr-1"
                          >
                            {user.departmentAccess.allDepartments ? (
                              <div className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {name}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {name}
                              </div>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAssignDepartments(user)}
                          className="h-8 w-8 p-0"
                          disabled={departments.length === 0}
                          title={departments.length === 0 ? "No departments available" : "Assign departments"}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveUser(user.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {selectedUser && (
        <AssignDepartmentsDialog
          user={selectedUser}
          departments={departments}
          isOpen={isAssignDialogOpen}
          onClose={() => setIsAssignDialogOpen(false)}
          onComplete={handleAssignmentComplete}
        />
      )}
    </>
  );
}
