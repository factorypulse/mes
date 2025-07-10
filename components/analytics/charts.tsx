"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// Enhanced color palette for charts
const CHART_COLORS = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  muted: "#64748b",
};

const STATUS_COLORS = {
  in_progress: "#10b981",
  paused: "#f59e0b",
  pending: "#64748b",
  waiting: "#3b82f6",
  completed: "#6366f1",
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 border border-border rounded-lg shadow-lg p-3 backdrop-blur-sm">
        <p className="font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">
              {formatter ? formatter(entry.value, entry.name) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Trend indicator component
const TrendIndicator = ({
  value,
  label,
  suffix = "",
}: {
  value: number;
  label: string;
  suffix?: string;
}) => {
  const isPositive = value > 0;
  const isNegative = value < 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <div
        className={`flex items-center gap-1 ${
          isPositive
            ? "text-green-600"
            : isNegative
            ? "text-red-600"
            : "text-muted-foreground"
        }`}
      >
        {isPositive && <TrendingUp className="h-3 w-3" />}
        {isNegative && <TrendingDown className="h-3 w-3" />}
        {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
        <span className="text-xs font-medium">
          {Math.abs(value).toFixed(1)}
          {suffix}
        </span>
      </div>
    </div>
  );
};

// Cycle Time Trend Chart
export function CycleTimeTrendChart({
  data,
  title = "Cycle Time Trends",
  height = 300,
}: {
  data: Array<{
    date: string;
    averageCycleTime: number;
    operationsCount: number;
  }>;
  title?: string;
  height?: number;
}) {
  const formatTooltip = (value: number, name: string) => {
    if (name === "averageCycleTime") return `${value.toFixed(1)}m`;
    return value;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant="outline" className="text-xs">
            {data.length} days
          </Badge>
        </CardTitle>
        <CardDescription>
          Average cycle time and operations count over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data}>
            <defs>
              <linearGradient
                id="cycleTimeGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={CHART_COLORS.primary}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={CHART_COLORS.primary}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={12}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis
              yAxisId="time"
              orientation="left"
              stroke="#64748b"
              fontSize={12}
              tickFormatter={(value) => `${value}m`}
            />
            <YAxis
              yAxisId="count"
              orientation="right"
              stroke="#64748b"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip formatter={formatTooltip} />} />
            <Legend />
            <Area
              yAxisId="time"
              type="monotone"
              dataKey="averageCycleTime"
              stroke={CHART_COLORS.primary}
              fill="url(#cycleTimeGradient)"
              strokeWidth={2}
              name="Avg Cycle Time (min)"
            />
            <Bar
              yAxisId="count"
              dataKey="operationsCount"
              fill={CHART_COLORS.secondary}
              opacity={0.6}
              name="Operations Count"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// WIP Status Distribution Chart
export function WIPDistributionChart({
  data,
  title = "WIP Distribution by Status",
}: {
  data: {
    pending: number;
    in_progress: number;
    paused: number;
    waiting: number;
  };
  title?: string;
}) {
  const chartData = [
    {
      name: "In Progress",
      value: data.in_progress,
      color: STATUS_COLORS.in_progress,
    },
    { name: "Paused", value: data.paused, color: STATUS_COLORS.paused },
    { name: "Pending", value: data.pending, color: STATUS_COLORS.pending },
    { name: "Waiting", value: data.waiting, color: STATUS_COLORS.waiting },
  ].filter((item) => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Current work distribution across different statuses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="w-full lg:w-1/2">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full lg:w-1/2 space-y-3">
            {chartData.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg border"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{item.value}</span>
                  <span className="text-xs text-muted-foreground">
                    ({((item.value / total) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Department Performance Chart
export function DepartmentPerformanceChart({
  data,
  title = "Department Performance",
  metric = "efficiency",
}: {
  data: Array<{
    departmentName: string;
    averageEfficiency?: number;
    averageCycleTime?: number;
    operationsPerHour?: number;
    operationsCount: number;
  }>;
  title?: string;
  metric?: "efficiency" | "cycleTime" | "throughput";
}) {
  const getDataKey = () => {
    switch (metric) {
      case "efficiency":
        return "averageEfficiency";
      case "cycleTime":
        return "averageCycleTime";
      case "throughput":
        return "operationsPerHour";
      default:
        return "averageEfficiency";
    }
  };

  const getUnit = () => {
    switch (metric) {
      case "efficiency":
        return "%";
      case "cycleTime":
        return "m";
      case "throughput":
        return "/hr";
      default:
        return "%";
    }
  };

  const formatTooltip = (value: number) => `${value.toFixed(1)}${getUnit()}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {metric === "efficiency" && "Efficiency rate by department"}
          {metric === "cycleTime" && "Average cycle time by department"}
          {metric === "throughput" && "Operations per hour by department"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="horizontal" margin={{ left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              type="number"
              stroke="#64748b"
              fontSize={12}
              tickFormatter={(value) => `${value}${getUnit()}`}
            />
            <YAxis
              type="category"
              dataKey="departmentName"
              stroke="#64748b"
              fontSize={12}
              width={50}
            />
            <Tooltip content={<CustomTooltip formatter={formatTooltip} />} />
            <Bar
              dataKey={getDataKey()}
              fill={CHART_COLORS.primary}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Multi-metric Performance Chart
export function PerformanceTrendChart({
  data,
  title = "Performance Trends",
}: {
  data: Array<{
    date: string;
    efficiency: number;
    cycleTime: number;
    throughput: number;
  }>;
  title?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Key performance indicators over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={12}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis
              yAxisId="percentage"
              orientation="left"
              stroke="#64748b"
              fontSize={12}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis
              yAxisId="time"
              orientation="right"
              stroke="#64748b"
              fontSize={12}
              tickFormatter={(value) => `${value}m`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="percentage"
              type="monotone"
              dataKey="efficiency"
              stroke={CHART_COLORS.success}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.success, strokeWidth: 2, r: 4 }}
              name="Efficiency (%)"
            />
            <Line
              yAxisId="time"
              type="monotone"
              dataKey="cycleTime"
              stroke={CHART_COLORS.warning}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.warning, strokeWidth: 2, r: 4 }}
              name="Cycle Time (min)"
            />
            <Line
              yAxisId="percentage"
              type="monotone"
              dataKey="throughput"
              stroke={CHART_COLORS.info}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.info, strokeWidth: 2, r: 4 }}
              name="Throughput (/hr)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Export the trend indicator for reuse
export { TrendIndicator };
