import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Package, CheckCircle } from "lucide-react";

// Mock data for recent manufacturing activity
const recentActivity = [
  {
    id: "WO-2024-001",
    type: "Work Order Completed",
    operator: "Sarah Chen",
    operatorInitials: "SC",
    department: "Assembly",
    time: "2 minutes ago",
    status: "completed" as const,
  },
  {
    id: "WO-2024-002",
    type: "Order Started",
    operator: "Mike Johnson",
    operatorInitials: "MJ",
    department: "Machining",
    time: "8 minutes ago",
    status: "active" as const,
  },
  {
    id: "WO-2024-003",
    type: "Quality Check Passed",
    operator: "Lisa Wang",
    operatorInitials: "LW",
    department: "Quality Control",
    time: "15 minutes ago",
    status: "completed" as const,
  },
  {
    id: "WO-2024-004",
    type: "Setup in Progress",
    operator: "David Brown",
    operatorInitials: "DB",
    department: "Assembly",
    time: "23 minutes ago",
    status: "pending" as const,
  },
  {
    id: "WO-2024-005",
    type: "Order Paused",
    operator: "Emma Wilson",
    operatorInitials: "EW",
    department: "Packaging",
    time: "35 minutes ago",
    status: "paused" as const,
  },
];

function ActivityIcon({ type }: { type: string }) {
  if (type.includes("Completed") || type.includes("Passed")) {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }
  if (type.includes("Started") || type.includes("Progress")) {
    return <Package className="h-4 w-4 text-blue-500" />;
  }
  return <Clock className="h-4 w-4 text-muted-foreground" />;
}

export function RecentSales() {
  return (
    <div className="space-y-4">
      {recentActivity.map((activity) => (
        <div
          key={activity.id}
          className="glass-subtle rounded-lg p-4 transition-all duration-200 hover:bg-primary/5 group"
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <Avatar className="h-10 w-10 border border-border/50">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {activity.operatorInitials}
              </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <ActivityIcon type={activity.type} />
                  <p className="text-sm font-medium leading-none">
                    {activity.type}
                  </p>
                </div>
                <Badge 
                  variant={activity.status}
                  className="text-xs"
                >
                  {activity.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {activity.operator} • {activity.department}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {activity.id}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {activity.time}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
