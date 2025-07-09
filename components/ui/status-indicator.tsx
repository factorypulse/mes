"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export type StatusType =
  | "active"
  | "pending"
  | "paused"
  | "completed"
  | "error"
  | "warning"
  | "waiting";

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  icon?: LucideIcon;
  size?: "sm" | "md" | "lg";
  variant?: "dot" | "badge" | "pill";
  animate?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  label,
  icon: Icon,
  size = "md",
  variant = "badge",
  animate = true,
  className,
}: StatusIndicatorProps) {
  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case "active":
        return {
          color: "bg-green-500",
          textColor: "text-green-400",
          borderColor: "border-green-500/30",
          bgColor: "bg-green-500/10",
          label: "Active",
        };
      case "pending":
        return {
          color: "bg-blue-500",
          textColor: "text-blue-400",
          borderColor: "border-blue-500/30",
          bgColor: "bg-blue-500/10",
          label: "Pending",
        };
      case "paused":
        return {
          color: "bg-yellow-500",
          textColor: "text-yellow-400",
          borderColor: "border-yellow-500/30",
          bgColor: "bg-yellow-500/10",
          label: "Paused",
        };
      case "completed":
        return {
          color: "bg-gray-500",
          textColor: "text-gray-400",
          borderColor: "border-gray-500/30",
          bgColor: "bg-gray-500/10",
          label: "Completed",
        };
      case "error":
        return {
          color: "bg-red-500",
          textColor: "text-red-400",
          borderColor: "border-red-500/30",
          bgColor: "bg-red-500/10",
          label: "Error",
        };
      case "warning":
        return {
          color: "bg-orange-500",
          textColor: "text-orange-400",
          borderColor: "border-orange-500/30",
          bgColor: "bg-orange-500/10",
          label: "Warning",
        };
      case "waiting":
        return {
          color: "bg-slate-500",
          textColor: "text-slate-400",
          borderColor: "border-slate-500/30",
          bgColor: "bg-slate-500/10",
          label: "Waiting",
        };
      default:
        return {
          color: "bg-gray-500",
          textColor: "text-gray-400",
          borderColor: "border-gray-500/30",
          bgColor: "bg-gray-500/10",
          label: "Unknown",
        };
    }
  };

  const getSizeConfig = (size: string) => {
    switch (size) {
      case "sm":
        return {
          dot: "w-2 h-2",
          badge: "px-2 py-1 text-xs",
          pill: "px-3 py-1 text-xs",
          icon: "w-3 h-3",
        };
      case "md":
        return {
          dot: "w-3 h-3",
          badge: "px-2.5 py-1.5 text-sm",
          pill: "px-4 py-1.5 text-sm",
          icon: "w-4 h-4",
        };
      case "lg":
        return {
          dot: "w-4 h-4",
          badge: "px-3 py-2 text-base",
          pill: "px-5 py-2 text-base",
          icon: "w-5 h-5",
        };
      default:
        return {
          dot: "w-3 h-3",
          badge: "px-2.5 py-1.5 text-sm",
          pill: "px-4 py-1.5 text-sm",
          icon: "w-4 h-4",
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const sizeConfig = getSizeConfig(size);
  const displayLabel = label || statusConfig.label;

  if (variant === "dot") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="relative">
          <div
            className={cn("rounded-full", statusConfig.color, sizeConfig.dot)}
          />
          {animate && status === "active" && (
            <div
              className={cn(
                "absolute inset-0 rounded-full animate-ping",
                statusConfig.color,
                "opacity-75"
              )}
            />
          )}
        </div>
        {displayLabel && (
          <span className={cn("font-medium", statusConfig.textColor)}>
            {displayLabel}
          </span>
        )}
      </div>
    );
  }

  const baseClasses = cn(
    "inline-flex items-center gap-2 rounded-full font-medium glass-subtle border",
    statusConfig.textColor,
    statusConfig.borderColor,
    statusConfig.bgColor,
    variant === "badge" ? sizeConfig.badge : sizeConfig.pill,
    className
  );

  return (
    <div className={baseClasses}>
      {Icon && <Icon className={sizeConfig.icon} />}

      <div className="relative">
        <div className={cn("w-2 h-2 rounded-full", statusConfig.color)} />
        {animate && status === "active" && (
          <div
            className={cn(
              "absolute inset-0 w-2 h-2 rounded-full animate-ping",
              statusConfig.color,
              "opacity-75"
            )}
          />
        )}
      </div>

      {displayLabel && <span>{displayLabel}</span>}
    </div>
  );
}
