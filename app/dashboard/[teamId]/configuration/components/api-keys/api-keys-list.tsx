"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Eye, EyeOff, Copy, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { CreateAPIKeyDialog } from "./create-api-key-dialog";

interface APIKey {
  id: string;
  name: string;
  description?: string;
  keyPrefix: string;
  permissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  isActive: boolean;
  expiresAt?: string;
  lastUsedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface APIKeysListProps {
  teamId: string;
}

export function APIKeysList({ teamId }: APIKeysListProps) {
  const [apiKeys, setAPIKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<APIKey | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAPIKeys();
  }, [teamId]);

  const fetchAPIKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teams/${teamId}/api-keys`);
      if (!response.ok) {
        throw new Error("Failed to fetch API keys");
      }
      const data = await response.json();
      setAPIKeys(data.apiKeys || []);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async (apiKey: APIKey) => {
    try {
      const response = await fetch(
        `/api/teams/${teamId}/api-keys/${apiKey.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to revoke API key");
      }

      toast.success(`API key "${apiKey.name}" has been revoked`);

      // Refresh the list
      fetchAPIKeys();
    } catch (error) {
      console.error("Error revoking API key:", error);
      toast.error("Failed to revoke API key");
    }

    setKeyToDelete(null);
  };

  const handleToggleVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      toast.success("API key prefix copied to clipboard");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  const getPermissionBadges = (permissions: APIKey["permissions"]) => {
    const badges = [];
    if (permissions.read)
      badges.push(
        <Badge key="read" variant="secondary">
          Read
        </Badge>
      );
    if (permissions.write)
      badges.push(
        <Badge key="write" variant="default">
          Write
        </Badge>
      );
    if (permissions.admin)
      badges.push(
        <Badge key="admin" variant="destructive">
          Admin
        </Badge>
      );
    return badges;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = (expiresAt?: string) => {
    return expiresAt ? new Date(expiresAt) < new Date() : false;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Loading API keys...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Manage API keys for external system integrations. Keep your keys
              secure and rotate them regularly.
            </CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create API Key
          </Button>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No API keys found</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first API key
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h4 className="font-medium">{apiKey.name}</h4>
                        {apiKey.description && (
                          <p className="text-sm text-muted-foreground">
                            {apiKey.description}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        {getPermissionBadges(apiKey.permissions)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          apiKey.isActive && !isExpired(apiKey.expiresAt)
                            ? "default"
                            : "secondary"
                        }
                      >
                        {isExpired(apiKey.expiresAt)
                          ? "Expired"
                          : apiKey.isActive
                          ? "Active"
                          : "Inactive"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleToggleVisibility(apiKey.id)}
                          >
                            {visibleKeys.has(apiKey.id) ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Hide Key
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Show Key
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCopyKey(apiKey.keyPrefix)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Prefix
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setKeyToDelete(apiKey)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Revoke Key
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Key Prefix</p>
                      <p className="font-mono">
                        {visibleKeys.has(apiKey.id)
                          ? apiKey.keyPrefix
                          : `${apiKey.keyPrefix.slice(0, 8)}...`}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Used</p>
                      <p>
                        {apiKey.lastUsedAt
                          ? formatDate(apiKey.lastUsedAt)
                          : "Never"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {apiKey.expiresAt ? "Expires" : "Created"}
                      </p>
                      <p>
                        {apiKey.expiresAt
                          ? formatDate(apiKey.expiresAt)
                          : formatDate(apiKey.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateAPIKeyDialog
        teamId={teamId}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchAPIKeys}
      />

      <AlertDialog
        open={!!keyToDelete}
        onOpenChange={() => setKeyToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the API key &ldquo;
              {keyToDelete?.name}&rdquo;? This action cannot be undone and will
              immediately disable all access for this key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => keyToDelete && handleRevokeKey(keyToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
