"use client";

import {
  LucideIcon,
  TrendingUp,
  Factory,
  CheckCircle,
  AlertTriangle,
  Users,
  Activity,
  Clock,
  Target,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icon mapping for server component compatibility
const iconMap: Record<string, LucideIcon> = {
  "trending-up": TrendingUp,
  factory: Factory,
  "check-circle": CheckCircle,
  "alert-triangle": AlertTriangle,
  users: Users,
  activity: Activity,
  clock: Clock,
  target: Target,
  zap: Zap,
};

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: "up" | "down" | "neutral";
  };
  icon: string; // Changed from LucideIcon to string
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

export function MetricsCard({
  title,
  value,
  change,
  icon,
  variant = "default",
  className,
}: MetricsCardProps) {
  const IconComponent = iconMap[icon] || Activity; // Fallback to Activity icon

  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case "success":
        return "border-green-500/30 bg-green-500/5";
      case "warning":
        return "border-yellow-500/30 bg-yellow-500/5";
      case "error":
        return "border-red-500/30 bg-red-500/5";
      default:
        return "border-primary/30 bg-primary/5";
    }
  };

  const getIconStyles = (variant: string) => {
    switch (variant) {
      case "success":
        return "text-green-500";
      case "warning":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      default:
        return "text-primary";
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-green-500";
      case "down":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div
      className={cn(
        "bento-card group relative",
        getVariantStyles(variant),
        className
      )}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <div
            className={cn(
              "p-2 rounded-lg glass-subtle",
              getIconStyles(variant)
            )}
          >
            <IconComponent className="h-4 w-4" />
          </div>
        </div>

        {/* Value */}
        <div className="space-y-2">
          <p className="text-3xl font-bold gradient-text">{value}</p>

          {/* Change indicator */}
          {change && (
            <p
              className={cn(
                "text-sm font-medium flex items-center gap-1",
                getTrendColor(change.trend)
              )}
            >
              {change.trend === "up" && "↗"}
              {change.trend === "down" && "↘"}
              {change.trend === "neutral" && "→"}
              {change.value}
            </p>
          )}
        </div>
      </div>

      {/* Subtle glow effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-xl",
          variant === "success" && "bg-green-500/20",
          variant === "warning" && "bg-yellow-500/20",
          variant === "error" && "bg-red-500/20",
          variant === "default" && "bg-primary/20"
        )}
      />
    </div>
  );
}
