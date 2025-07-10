"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Activity,
  AlertTriangle,
  Factory,
  Users,
  RefreshCw
} from "lucide-react";
import { useState } from "react";

interface AnalyticsNavigationProps {
  teamId: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
}

const navigationItems: NavItem[] = [
  {
    name: "Overview",
    href: "",
    icon: BarChart3,
    description: "Key metrics and summary"
  },
  {
    name: "Performance",
    href: "/performance",
    icon: TrendingUp,
    description: "Cycle times and efficiency"
  },
  {
    name: "WIP Monitoring",
    href: "/wip",
    icon: Factory,
    description: "Work in progress tracking"
  },
  {
    name: "Cycle Time",
    href: "/cycle-time",
    icon: Clock,
    description: "Detailed timing analysis"
  },
  {
    name: "Quality",
    href: "/quality",
    icon: Target,
    description: "Quality metrics and trends"
  },
  {
    name: "Efficiency",
    href: "/efficiency",
    icon: Activity,
    description: "Operational efficiency tracking"
  },
  {
    name: "Department",
    href: "/department",
    icon: Users,
    description: "Department performance and utilization"
  }
];

export function AnalyticsNavigation({ teamId }: AnalyticsNavigationProps) {
  const pathname = usePathname();
  const basePath = `/dashboard/${teamId}/analytics`;
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger a page refresh to update all data
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Activity className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
          <span className="text-sm text-muted-foreground">
            Auto-refreshes every 30 seconds
          </span>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh All
        </Button>
      </div>

      {/* Navigation Pills */}
      <div className="flex flex-wrap gap-2">
        {navigationItems.map((item) => {
          const isActive = pathname === `${basePath}${item.href}`;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={`${basePath}${item.href}`}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200",
                "hover:bg-primary/5 hover:border-primary/20",
                isActive
                  ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                  : "bg-background/50 border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{item.name}</span>
              {item.badge && (
                <Badge variant="secondary" className="text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </div>

      {/* Current Page Description */}
      <div className="p-4 rounded-lg border bg-muted/20">
        {navigationItems.map((item) => {
          const isActive = pathname === `${basePath}${item.href}`;
          if (!isActive) return null;

          const Icon = item.icon;
          return (
            <div key={item.name} className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
