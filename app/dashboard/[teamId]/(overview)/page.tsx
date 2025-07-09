import { Metadata } from "next";
import { Suspense } from "react";

import { RecentSales } from "@/app/dashboard/[teamId]/(overview)/recent-sales";
import { Graph } from "./graph";
import { MetricsCard } from "@/components/ui/metrics-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { ColorModeSwitcher } from "@/components/color-mode-switcher";
import { ShoppingCart, Users, BarChart3, Zap, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Manufacturing Dashboard",
  description: "Real-time manufacturing execution system overview",
};

// Mock data - in real app this would come from API
const dashboardData = {
  production: {
    efficiency: 87.5,
    throughput: 245,
    quality: 96.2,
    downtime: 23,
  },
  orders: {
    active: 12,
    pending: 34,
    completed: 187,
    urgent: 3,
  },
  operators: {
    active: 28,
    total: 35,
    shifts: 3,
  },
};

function DashboardHeader() {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-4xl font-bold gradient-text mb-2">
          Manufacturing Overview
        </h1>
        <p className="text-muted-foreground text-lg">
          Real-time production insights and system performance
        </p>
      </div>
      <div className="flex items-center gap-4">
        <StatusIndicator status="active" label="System Online" />
      </div>
    </div>
  );
}

function ProductionMetrics() {
  return (
    <div className="bento-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <MetricsCard
        title="Production Efficiency"
        value={`${dashboardData.production.efficiency}%`}
        change={{ value: "+5.2% from yesterday", trend: "up" }}
        icon="trending-up"
        variant="success"
      />

      <MetricsCard
        title="Hourly Throughput"
        value={dashboardData.production.throughput}
        change={{ value: "+12 units/hr", trend: "up" }}
        icon="factory"
        variant="default"
      />

      <MetricsCard
        title="Quality Score"
        value={`${dashboardData.production.quality}%`}
        change={{ value: "Stable", trend: "neutral" }}
        icon="check-circle"
        variant="success"
      />

      <MetricsCard
        title="Downtime Today"
        value={`${dashboardData.production.downtime}m`}
        change={{ value: "-8m from yesterday", trend: "up" }}
        icon="alert-triangle"
        variant="warning"
      />
    </div>
  );
}

function QuickStats() {
  return (
    <div className="bento-grid grid-cols-1 lg:grid-cols-3">
      {/* Active Orders */}
      <div className="bento-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Active Orders</h3>

          <ShoppingCart className="h-5 w-5 text-primary" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">In Progress</span>
            <div className="flex items-center gap-2">
              <StatusIndicator status="active" variant="dot" size="sm" />
              <span className="font-semibold">
                {dashboardData.orders.active}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pending</span>
            <div className="flex items-center gap-2">
              <StatusIndicator status="pending" variant="dot" size="sm" />
              <span className="font-semibold">
                {dashboardData.orders.pending}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Urgent</span>
            <div className="flex items-center gap-2">
              <StatusIndicator status="warning" variant="dot" size="sm" />
              <span className="font-semibold text-orange-500">
                {dashboardData.orders.urgent}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Operator Status */}
      <div className="bento-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Workforce</h3>

          {/* icon of team */}
          <Users className="h-5 w-5 text-primary" />
        </div>

        <div className="flex items-center justify-center">
          <ProgressRing
            progress={
              (dashboardData.operators.active / dashboardData.operators.total) *
              100
            }
            size="lg"
            variant="success"
          >
            <div className="text-center">
              <div className="text-2xl font-bold gradient-text">
                {dashboardData.operators.active}
              </div>
              <div className="text-xs text-muted-foreground">
                of {dashboardData.operators.total}
              </div>
            </div>
          </ProgressRing>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Active Operators • {dashboardData.operators.shifts} Shifts
          </p>
        </div>
      </div>

      {/* System Health */}
      <div className="bento-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">System Health</h3>
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Database</span>
            <StatusIndicator status="active" variant="dot" size="sm" animate />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">API Services</span>
            <StatusIndicator status="active" variant="dot" size="sm" animate />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Real-time Sync</span>
            <StatusIndicator status="active" variant="dot" size="sm" animate />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Machine Sensors</span>
            <StatusIndicator status="warning" variant="dot" size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartsSection() {
  return (
    <div className="bento-grid grid-cols-1 lg:grid-cols-7">
      <div className="lg:col-span-4 bento-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-1">Production Overview</h3>
            <p className="text-sm text-muted-foreground">
              Hourly production trends and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-500">
              Live Data
            </span>
          </div>
        </div>
        <div className="h-[300px]">
          <Graph />
        </div>
      </div>

      <div className="lg:col-span-3 bento-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-1">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">
              Latest order completions and updates
            </p>
          </div>
          <Clock className="h-5 w-5 text-primary" />
        </div>
        <Suspense
          fallback={
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="glass-subtle rounded-lg p-3 animate-pulse"
                >
                  <div className="h-4 bg-muted/20 rounded mb-2" />
                  <div className="h-3 bg-muted/10 rounded w-3/4" />
                </div>
              ))}
            </div>
          }
        >
          <RecentSales />
        </Suspense>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      {/* Ambient background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" />
        <div
          className="absolute top-1/3 right-1/4 w-72 h-72 bg-chart-2/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-chart-3/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <div className="relative z-10 p-8 space-y-8">
        <DashboardHeader />
        <ProductionMetrics />
        <QuickStats />
        <ChartsSection />
      </div>
    </div>
  );
}
