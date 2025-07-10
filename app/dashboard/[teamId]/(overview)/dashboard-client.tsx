"use client";

import { motion } from "framer-motion";
import { Suspense } from "react";
import { RecentActivity } from "./recent-activity";
import { Graph } from "./graph";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Zap, Clock, Activity, Factory, AlertTriangle, CheckCircle, LucideIcon } from "lucide-react";

export function DashboardHeader() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex items-center justify-between mb-8"
    >
      <div>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl font-bold gradient-text mb-2"
        >
          Manufacturing Overview
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-muted-foreground text-lg"
        >
          Real-time production insights and system performance
        </motion.p>
      </div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex items-center gap-4"
      >
        <Badge variant="active" className="animate-pulse">
          System Online
        </Badge>
      </motion.div>
    </motion.div>
  );
}

export function ProductionMetrics({ data }: { data: any }) {
  const totalActiveOrders =
    data.ordersPending +
    data.ordersInProgress +
    data.ordersPaused +
    data.ordersWaiting;

  const getIcon = (iconName: string): LucideIcon => {
    const iconMap: Record<string, LucideIcon> = {
      activity: Activity,
      factory: Factory,
      "alert-triangle": AlertTriangle,
      "check-circle": CheckCircle,
      clock: Clock,
    };
    return iconMap[iconName] || Activity;
  };

  interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon: string;
    variant?: "default" | "success" | "warning";
  }

  const MetricCard = ({ title, value, subtitle, icon, variant = "default", index }: MetricCardProps & { index: number }) => {
    const IconComponent = getIcon(icon);
    const variantClasses = {
      default: "border-primary/30 bg-primary/5",
      success: "border-green-500/30 bg-green-500/5",
      warning: "border-yellow-500/30 bg-yellow-500/5",
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.4, 
          delay: index * 0.1,
          ease: "easeOut"
        }}
        whileHover={{ 
          y: -4, 
          transition: { duration: 0.2 } 
        }}
      >
        <Card className={`relative ${variantClasses[variant]} transition-all duration-200 hover:shadow-lg hover:shadow-primary/5`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {title}
              </p>
              <motion.div 
                className="p-2 rounded-lg bg-primary/10"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <IconComponent className="h-4 w-4 text-primary" />
              </motion.div>
            </div>
            <div className="space-y-2">
              <motion.p 
                className="text-3xl font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 + 0.2 }}
              >
                {value}
              </motion.p>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const metrics = [
    {
      title: "Live Orders",
      value: totalActiveOrders,
      subtitle: "Total active",
      icon: "activity",
      variant: "default" as const,
    },
    {
      title: "Ops in progress",
      value: data.operationsInProgress,
      subtitle: "Currently active",
      icon: "factory",
      variant: "success" as const,
    },
    {
      title: "Ops paused",
      value: data.operationsPaused,
      subtitle: "Currently paused",
      icon: "alert-triangle",
      variant: "warning" as const,
    },
    {
      title: "Orders completed (today)",
      value: data.ordersCompletedToday,
      subtitle: "Orders finished",
      icon: "check-circle",
      variant: "success" as const,
    },
    {
      title: "Avg cycle time",
      value: data.averageCycleTime > 0 ? `${data.averageCycleTime}m` : "N/A",
      subtitle: "Per order",
      icon: "clock",
      variant: "default" as const,
    },
  ];

  return (
    <div className="bento-grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5">
      {metrics.map((metric, index) => (
        <MetricCard
          key={metric.title}
          index={index}
          {...metric}
        />
      ))}
    </div>
  );
}

export function QuickStats({ dashboardData }: { dashboardData: any }) {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
      }
    })
  };

  return (
    <div className="bento-grid grid-cols-1 lg:grid-cols-3">
      {/* Order Status */}
      <motion.div 
        className="bento-card"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={0}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Order Status</h3>
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pending</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-500 dark:bg-gray-400"></div>
              <span className="font-semibold text-gray-500 dark:text-gray-400">
                {dashboardData.ordersPending}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">In Progress</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 animate-pulse"></div>
              <span className="font-semibold text-green-500 dark:text-green-400">
                {dashboardData.ordersInProgress}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Paused</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 dark:bg-orange-400"></div>
              <span className="font-semibold text-orange-500 dark:text-orange-400">
                {dashboardData.ordersPaused}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Waiting</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"></div>
              <span className="font-semibold text-blue-500 dark:text-blue-400">
                {dashboardData.ordersWaiting}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Operations Status */}
      <motion.div 
        className="bento-card"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={1}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Operations Status</h3>
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Running</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 animate-pulse"></div>
              <span className="font-semibold text-green-500 dark:text-green-400">
                {dashboardData.operationsInProgress}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Paused</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 dark:bg-orange-400"></div>
              <span className="font-semibold text-orange-500 dark:text-orange-400">
                {dashboardData.operationsPaused}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Completed Today
            </span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"></div>
              <span className="font-semibold text-blue-500 dark:text-blue-400">
                {dashboardData.completedOperationsToday}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Avg Cycle Time
            </span>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="font-semibold">
                {dashboardData.averageCycleTime > 0
                  ? `${dashboardData.averageCycleTime}m`
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* System Health */}
      <motion.div 
        className="bento-card"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={2}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">System Health</h3>
          <Zap className="h-5 w-5 text-primary" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Database</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">API Services</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Real-time Sync</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function ChartsSection() {
  return (
    <motion.div 
      className="bento-grid grid-cols-1 lg:grid-cols-7"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <motion.div 
        className="lg:col-span-4 bento-card"
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
      >
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
      </motion.div>

      <motion.div 
        className="lg:col-span-3 bento-card"
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
      >
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
          <RecentActivity />
        </Suspense>
      </motion.div>
    </motion.div>
  );
}