"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  AlertTriangle,
  FileText,
  Users,
  Key,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";

interface ConfigurationNavigationProps {
  teamId: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
  comingSoon?: boolean;
}

const navigationItems: NavItem[] = [
  {
    name: "Departments",
    href: "/departments",
    icon: Building2,
    description: "Manage organizational departments and workflows"
  },
  {
    name: "Users & Roles",
    href: "/users",
    icon: Users,
    description: "Manage user access and department assignments"
  },
  {
    name: "Data Collection",
    href: "/data-collection", 
    icon: FileText,
    description: "Configure data collection schemas and templates"
  },
  {
    name: "API Keys",
    href: "/api-keys",
    icon: Key,
    description: "Manage API access keys and integrations"
  },
  {
    name: "Pause Reasons",
    href: "/pause-reasons",
    icon: AlertTriangle,
    description: "Configure standardized pause reasons for operations",
    comingSoon: true
  }
];

export function ConfigurationNavigation({ teamId }: ConfigurationNavigationProps) {
  const pathname = usePathname();
  const basePath = `/dashboard/${teamId}/configuration`;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
          <p className="text-muted-foreground">
            Manage system settings, departments, and organizational preferences
          </p>
        </div>
      </div>

      {/* Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {navigationItems.map((item, index) => {
          const isActive = pathname === `${basePath}${item.href}`;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              {item.comingSoon ? (
                <div
                  className={cn(
                    "relative block p-6 rounded-xl border transition-all duration-200",
                    "bg-muted/30 border-muted cursor-not-allowed opacity-60"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-muted-foreground">{item.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          Coming Soon
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href={`${basePath}${item.href}`}
                  className={cn(
                    "relative block p-6 rounded-xl border transition-all duration-200",
                    "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1",
                    isActive
                      ? "bg-primary/5 border-primary/20 shadow-lg shadow-primary/5"
                      : "bg-background/50 border-border hover:bg-primary/2 hover:border-primary/10"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-lg transition-colors",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted/50 text-muted-foreground group-hover:text-primary"
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={cn(
                          "font-semibold text-lg",
                          isActive ? "text-primary" : "text-foreground"
                        )}>{item.name}</h3>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}