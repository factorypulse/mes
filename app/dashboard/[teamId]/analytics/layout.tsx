import { ReactNode } from "react";
import { AnalyticsNavigation } from "./components/analytics-navigation";

interface AnalyticsLayoutProps {
  children: ReactNode;
  params: Promise<{ teamId: string }>;
}

export default async function AnalyticsLayout({ children, params }: AnalyticsLayoutProps) {
  const { teamId } = await params;
  
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

      <div className="relative z-10 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Comprehensive manufacturing insights and performance analytics
          </p>
        </div>
        
        <AnalyticsNavigation teamId={teamId} />
        
        <div className="mt-8">
          {children}
        </div>
      </div>
    </div>
  );
}