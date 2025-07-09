"use client";

import { useState, use } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Building2,
  AlertTriangle,
  FileText,
  Users,
} from "lucide-react";
import { DepartmentsTab } from "./components/departments/departments-tab";
import { UsersTab } from "./components/users/users-tab";

interface ConfigurationPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default function ConfigurationPage({ params }: ConfigurationPageProps) {
  const { teamId } = use(params);
  const [activeTab, setActiveTab] = useState("departments");

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
          <p className="text-muted-foreground">
            Manage system settings, departments, and organizational preferences
          </p>
        </div>
      </div>

      {/* Configuration Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
          <CardDescription>
            Configure and manage your manufacturing execution system settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger
                value="departments"
                className="flex items-center gap-2"
              >
                <Building2 className="h-4 w-4" />
                Departments
              </TabsTrigger>
              <TabsTrigger
                value="pause-reasons"
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Pause Reasons
              </TabsTrigger>
              <TabsTrigger
                value="data-collection"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Data Collection
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users & Roles
              </TabsTrigger>
            </TabsList>

            <TabsContent value="departments" className="space-y-4">
              <DepartmentsTab teamId={teamId} />
            </TabsContent>

            <TabsContent value="pause-reasons" className="space-y-4">
              <div className="rounded-lg border border-dashed p-8 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  Pause Reasons Management
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Configure standardized pause reasons for production
                  operations.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Coming soon - Will centralize existing pause reason
                  functionality
                </p>
              </div>
            </TabsContent>

            <TabsContent value="data-collection" className="space-y-4">
              <div className="rounded-lg border border-dashed p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  Data Collection Activities
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Manage reusable data collection templates for operations.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Coming soon - Will include the new data collection activity
                  model
                </p>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <UsersTab teamId={teamId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
