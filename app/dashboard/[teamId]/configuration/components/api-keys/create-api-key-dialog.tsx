"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, Copy, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z.string().optional(),
  permissions: z
    .object({
      read: z.boolean(),
      write: z.boolean(),
      admin: z.boolean(),
    })
    .refine((data) => data.read || data.write || data.admin, {
      message: "At least one permission must be selected",
      path: ["permissions"],
    }),
  expiresAt: z.date().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateAPIKeyDialogProps {
  teamId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface CreatedAPIKey {
  id: string;
  name: string;
  secretKey: string;
  keyPrefix: string;
  permissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
}

export function CreateAPIKeyDialog({
  teamId,
  open,
  onOpenChange,
  onSuccess,
}: CreateAPIKeyDialogProps) {
  const [loading, setLoading] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreatedAPIKey | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: {
        read: true,
        write: false,
        admin: false,
      },
    },
  });

  const handleSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/teams/${teamId}/api-keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          permissions: data.permissions,
          expiresAt: data.expiresAt?.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create API key");
      }

      const result = await response.json();
      setCreatedKey(result.apiKey);

      toast.success("API key created successfully");
    } catch (error) {
      console.error("Error creating API key:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create API key"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCreatedKey(null);
    setShowSecretKey(false);
    form.reset();
    onOpenChange(false);
    if (createdKey) {
      onSuccess();
    }
  };

  const handleCopyKey = async () => {
    if (!createdKey) return;

    try {
      await navigator.clipboard.writeText(createdKey.secretKey);
      toast.success("API key copied to clipboard");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  const getPermissionBadges = (permissions: CreatedAPIKey["permissions"]) => {
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {createdKey ? "API Key Created" : "Create API Key"}
          </DialogTitle>
          <DialogDescription>
            {createdKey
              ? "Your API key has been created. Copy it now as you won't be able to see it again."
              : "Create a new API key for external system integrations."}
          </DialogDescription>
        </DialogHeader>

        {createdKey ? (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> This is the only time you&apos;ll
                see the full API key. Copy it now and store it securely.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Name</label>
                <p className="text-sm text-muted-foreground">
                  {createdKey.name}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Permissions</label>
                <div className="flex gap-1 mt-1">
                  {getPermissionBadges(createdKey.permissions)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">API Key</label>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex-1 p-2 bg-muted rounded border font-mono text-sm">
                    {showSecretKey ? createdKey.secretKey : "•".repeat(50)}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                  >
                    {showSecretKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleCopyKey}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Production ERP Integration"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this API key
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional details about how this key will be used..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permissions</FormLabel>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="read"
                          checked={field.value.read}
                          onCheckedChange={(checked) =>
                            field.onChange({ ...field.value, read: !!checked })
                          }
                        />
                        <label
                          htmlFor="read"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Read
                        </label>
                        <Badge variant="secondary">Read</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">
                        View orders, routings, work order operations, and
                        analytics
                      </p>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="write"
                          checked={field.value.write}
                          onCheckedChange={(checked) =>
                            field.onChange({ ...field.value, write: !!checked })
                          }
                        />
                        <label
                          htmlFor="write"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Write
                        </label>
                        <Badge variant="default">Write</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">
                        Create and update orders, operations, and data
                        collection
                      </p>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="admin"
                          checked={field.value.admin}
                          onCheckedChange={(checked) =>
                            field.onChange({ ...field.value, admin: !!checked })
                          }
                        />
                        <label
                          htmlFor="admin"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Admin
                        </label>
                        <Badge variant="destructive">Admin</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">
                        Full access including system configuration and user
                        management
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expiration Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>No expiration</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Leave empty for no expiration. You can always revoke the
                      key manually.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create API Key"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
