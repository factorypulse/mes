"use client";

import { cn } from "@/lib/utils";
import { useUser } from "@stackframe/stack";
import {
  BarChart4,
  Factory,
  Globe,
  Route,
  Settings2,
  ShoppingCart,
  Timer,
  User,
  Users,
  LucideIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ColorModeSwitcher } from "../color-mode-switcher";
import { useState } from "react";
import { Button } from "./button";

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  type: "item" | "separator" | "label";
}

interface ModernSidebarProps {
  teamId: string;
  className?: string;
}

const navigationItems: NavigationItem[] = [
  {
    name: "Overview",
    href: "/",
    icon: Globe,
    type: "item",
  },
  {
    name: "Production",
    href: "",
    icon: Factory, // placeholder, won't be used for separator
    type: "separator",
  },
  {
    name: "Routings",
    href: "/routings",
    icon: Route,
    type: "item",
  },
  {
    name: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    type: "item",
  },
  {
    name: "Operator",
    href: "/operator",
    icon: User,
    type: "item",
  },
  {
    name: "Management",
    href: "",
    icon: Factory, // placeholder
    type: "separator",
  },
  {
    name: "People",
    href: "/people",
    icon: Users,
    type: "item",
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart4,
    type: "item",
  },
  {
    name: "Settings",
    href: "",
    icon: Factory, // placeholder
    type: "separator",
  },
  {
    name: "Configuration",
    href: "/configuration",
    icon: Settings2,
    type: "item",
  },
];

function NavigationLink({
  item,
  basePath,
  isActive,
  isCollapsed,
}: {
  item: NavigationItem;
  basePath: string;
  isActive: boolean;
  isCollapsed: boolean;
}) {
  if (item.type === "separator") {
    return (
      <div className={cn("px-3 py-2", isCollapsed && "px-2")}>
        {!isCollapsed && (
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {item.name}
          </p>
        )}
        {isCollapsed && (
          <div className="h-px bg-border mx-auto w-6" />
        )}
      </div>
    );
  }

  return (
    <Link
      href={`${basePath}${item.href}`}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        "hover:bg-primary/10 hover:text-primary",
        isActive
          ? "bg-primary/15 text-primary shadow-sm border border-primary/20"
          : "text-muted-foreground hover:text-foreground",
        isCollapsed && "px-2 justify-center"
      )}
      title={isCollapsed ? item.name : undefined}
    >
      <item.icon
        className={cn(
          "h-5 w-5 transition-colors",
          isActive
            ? "text-primary"
            : "text-muted-foreground group-hover:text-primary"
        )}
      />
      {!isCollapsed && (
        <>
          {item.name}
          {isActive && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
          )}
        </>
      )}
      {isCollapsed && isActive && (
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 h-2 w-2 rounded-full bg-primary animate-pulse" />
      )}
    </Link>
  );
}

export function ModernSidebar({ teamId, className }: ModernSidebarProps) {
  const user = useUser({ or: "redirect" });
  const team = user.useTeam(teamId);
  const pathname = usePathname();
  const basePath = `/dashboard/${teamId}`;
  const [isCollapsed, setIsCollapsed] = useState(true);

  if (!team) return null;

  return (
    <div className={cn(
      "h-full flex flex-col transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-72",
      className
    )}>
      {/* Header */}
      <div className={cn(
        "border-b border-border/50 transition-all duration-300",
        isCollapsed ? "p-3" : "p-6"
      )}>
        {/* Display the team name and logo */}
        <div className={cn(
          "flex items-center transition-all duration-300",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <div className={cn(
            "flex items-center transition-all duration-300",
            isCollapsed ? "justify-center" : "gap-2"
          )}>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {team.profileImageUrl ? (
                <Image
                  width={32}
                  height={32}
                  src={team.profileImageUrl}
                  alt={team.displayName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-primary font-bold text-lg">
                  {team.displayName?.[0] || "T"}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <p className="text-sm font-medium truncate">
                {team.displayName || "Team"}
              </p>
            )}
          </div>
          {!isCollapsed && (
            <ColorModeSwitcher />
          )}
        </div>
        {/* Color mode switcher when collapsed */}
        {isCollapsed && (
          <div className="flex justify-center mt-3">
            <ColorModeSwitcher />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <div className={cn(
        "border-b border-border/50 transition-all duration-300",
        isCollapsed ? "p-2" : "p-4"
      )}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "w-full transition-all duration-300",
            isCollapsed ? "px-0 justify-center" : "justify-start"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Collapse
            </>
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 space-y-1 overflow-y-auto transition-all duration-300",
        isCollapsed ? "p-2" : "p-4"
      )}>
        {navigationItems.map((item, index) => (
          <NavigationLink
            key={index}
            item={item}
            basePath={basePath}
            isActive={pathname === `${basePath}${item.href}`}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className={cn(
        "border-t border-border/50 transition-all duration-300",
        isCollapsed ? "p-2" : "p-4"
      )}>
        <Link href="/handler/account-settings#profile">
          <div className={cn(
            "glass-subtle rounded-xl transition-all duration-200 hover:bg-primary/5 cursor-pointer",
            isCollapsed ? "p-2 flex justify-center" : "p-4"
          )}>
            <div className={cn(
              "flex items-center transition-all duration-300",
              isCollapsed ? "justify-center" : "gap-3"
            )}>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.displayName || "Operator"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.primaryEmail}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
