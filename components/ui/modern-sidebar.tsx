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
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ColorModeSwitcher } from "../color-mode-switcher";

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
}: {
  item: NavigationItem;
  basePath: string;
  isActive: boolean;
}) {
  if (item.type === "separator") {
    return (
      <div className="px-3 py-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {item.name}
        </p>
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
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <item.icon
        className={cn(
          "h-5 w-5 transition-colors",
          isActive
            ? "text-primary"
            : "text-muted-foreground group-hover:text-primary"
        )}
      />
      {item.name}
      {isActive && (
        <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
      )}
    </Link>
  );
}

export function ModernSidebar({ teamId, className }: ModernSidebarProps) {
  const user = useUser({ or: "redirect" });
  const team = user.useTeam(teamId);
  const pathname = usePathname();
  const basePath = `/dashboard/${teamId}`;

  if (!team) return null;

  return (
    <div className={cn("w-72 h-full flex flex-col", className)}>
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        {/* Display the team name and logo */}
        <div className="flex items-center gap-2">
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
          <p className="text-sm font-medium truncate">
            {team.displayName || "Team"}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item, index) => (
          <NavigationLink
            key={index}
            item={item}
            basePath={basePath}
            isActive={pathname === `${basePath}${item.href}`}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        <div className="glass-subtle rounded-xl p-4 transition-all duration-200 hover:bg-primary/5 cursor-pointer">
          <div className="flex items-center gap-3">
            <Link href="/handler/account-settings#profile" className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-3 w-3 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.displayName || "Operator"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.primaryEmail}
                </p>
              </div>
            </Link>

            <ColorModeSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
}
