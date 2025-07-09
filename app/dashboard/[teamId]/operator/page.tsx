'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useUser } from '@stackframe/stack'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OperatorDashboard } from '@/components/work-orders/operator-dashboard'
import { ActiveWOO } from '@/components/work-orders/active-woo'
import { StatusIndicator } from '@/components/ui/status-indicator'
import { ProgressRing } from '@/components/ui/progress-ring'
import { MetricsCard } from '@/components/ui/metrics-card'
import { ColorModeSwitcher } from '@/components/color-mode-switcher'
import {
  Clock,
  User,
  Factory,
  Zap,
  Target,
  Timer,
  TrendingUp,
  CheckCircle
} from 'lucide-react'
import { WOOWithRelations } from '@/lib/services/work-order-operations'

export default function OperatorPage() {
  const params = useParams<{ teamId: string }>()
  const user = useUser({ or: 'redirect' })
  const [activeWoo, setActiveWoo] = useState<WOOWithRelations | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Mock data for operator metrics
  const operatorStats = {
    todayEfficiency: 94.2,
    tasksCompleted: 12,
    qualityScore: 98.5,
    activeTime: 6.5 // hours
  }

  const handleWooUpdate = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleWooComplete = () => {
    setActiveWoo(null)
    setRefreshKey(prev => prev + 1)
  }

  const formatTimeOnShift = () => {
    const now = new Date()
    const shiftStart = new Date()
    shiftStart.setHours(7, 0, 0, 0) // Assuming 7 AM shift start

    const hours = Math.floor((now.getTime() - shiftStart.getTime()) / (1000 * 60 * 60))
    const minutes = Math.floor(((now.getTime() - shiftStart.getTime()) % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours}h ${minutes}m`
  }

  return (
    <div className="min-h-screen">
      {/* Ambient background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-green-500/5 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 p-8 space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Operator Workflow
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your work orders and track real-time progress
            </p>
          </div>
          <div className="flex items-center gap-4">
            <StatusIndicator
              status={activeWoo ? "active" : "pending"}
              label={activeWoo ? "Work in Progress" : "Ready for Work"}
              animate={!!activeWoo}
            />
            <ColorModeSwitcher />
          </div>
        </div>

        {/* Operator Info Card */}
        <div className="bento-card bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl glass-subtle">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {user.displayName || 'Operator'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {user.primaryEmail}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text">
                  {formatTimeOnShift()}
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Time on Shift
                </p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold gradient-text">
                  All Departments
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Access Level
                </p>
              </div>
            </div>
          </div>

          {/* Operator Performance Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 glass-subtle rounded-xl">
              <ProgressRing progress={operatorStats.todayEfficiency} size="sm" variant="success">
                <span className="text-xs font-semibold">
                  {operatorStats.todayEfficiency}%
                </span>
              </ProgressRing>
              <p className="text-sm text-muted-foreground mt-2">Efficiency</p>
            </div>

            <div className="text-center p-4 glass-subtle rounded-xl">
              <div className="text-2xl font-bold gradient-text mb-1">
                {operatorStats.tasksCompleted}
              </div>
              <p className="text-sm text-muted-foreground">Tasks Done</p>
            </div>

            <div className="text-center p-4 glass-subtle rounded-xl">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {operatorStats.qualityScore}%
              </div>
              <p className="text-sm text-muted-foreground">Quality</p>
            </div>

            <div className="text-center p-4 glass-subtle rounded-xl">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {operatorStats.activeTime}h
              </div>
              <p className="text-sm text-muted-foreground">Active Time</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-8">
          <TabsList className="glass-card border-0 p-1">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:glass-subtle data-[state=active]:text-primary"
            >
              <div className="flex items-center gap-2">
                <Factory className="h-4 w-4" />
                Work Queue
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="active"
              disabled={!activeWoo}
              className="data-[state=active]:glass-subtle data-[state=active]:text-primary"
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Active Work Order
                {activeWoo && (
                  <div className="flex items-center gap-1 ml-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                      In Progress
                    </span>
                  </div>
                )}
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="bento-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold mb-1">Available Work Orders</h3>
                  <p className="text-sm text-muted-foreground">
                    Select a work order to begin production
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500">Real-time Queue</span>
                </div>
              </div>

              <OperatorDashboard
                key={refreshKey}
                teamId={params.teamId}
                operatorId={user.id}
              />
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            {activeWoo ? (
              <div className="bento-card border-l-4 border-l-green-500">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">Active Work Order</h3>
                    <p className="text-sm text-muted-foreground">
                      Currently in progress - track time and capture data
                    </p>
                  </div>
                  <StatusIndicator status="active" animate />
                </div>

                <ActiveWOO
                  woo={activeWoo}
                  onUpdate={handleWooUpdate}
                  onComplete={handleWooComplete}
                />
              </div>
            ) : (
              <div className="bento-card text-center py-16">
                <div className="w-24 h-24 rounded-full glass-subtle flex items-center justify-center mx-auto mb-6">
                  <Clock className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-muted-foreground mb-4">
                  No Active Work Order
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Start a work order from your queue to begin tracking time and capturing production data.
                  Your progress will be monitored in real-time.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
