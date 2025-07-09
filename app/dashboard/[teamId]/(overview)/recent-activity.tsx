import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Clock, Package, CheckCircle, Play, Pause } from "lucide-react";

interface ActivityData {
  id: string
  orderNumber: string
  routingName: string
  operationName: string
  operationNumber: number
  department: string
  operatorName: string
  status: string
  statusColor: string
  activity: string
  timestamp: string
  quantityCompleted: number
}

async function fetchRecentActivity(): Promise<ActivityData[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/analytics/recent-activity`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch recent activity')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return []
  }
}

function ActivityIcon({ activity }: { activity: string }) {
  if (activity === "Completed") {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }
  if (activity === "Started") {
    return <Play className="h-4 w-4 text-blue-500" />;
  }
  if (activity === "Paused") {
    return <Pause className="h-4 w-4 text-orange-500" />;
  }
  return <Package className="h-4 w-4 text-muted-foreground" />;
}

function getOperatorInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'UN'
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date()
  const time = new Date(timestamp)
  const diffInMs = now.getTime() - time.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d ago`
}

export async function RecentActivity() {
  const activities = await fetchRecentActivity()
  
  if (activities.length === 0) {
    return (
      <div className="space-y-4">
        <div className="glass-subtle rounded-lg p-8 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="glass-subtle rounded-lg p-4 transition-all duration-200 hover:bg-primary/5 group"
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <Avatar className="h-10 w-10 border border-border/50">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getOperatorInitials(activity.operatorName)}
              </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <ActivityIcon activity={activity.activity} />
                  <p className="text-sm font-medium leading-none">
                    {activity.activity} Operation
                  </p>
                </div>
                <StatusIndicator
                  status={activity.status as any}
                  variant="dot"
                  size="sm"
                  animate={activity.status === 'in_progress'}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {activity.operatorName} • {activity.department}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {activity.orderNumber} - Op {activity.operationNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.operationName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                  {activity.quantityCompleted > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Qty: {activity.quantityCompleted}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}