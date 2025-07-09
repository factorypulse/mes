import { ReactNode, Suspense } from "react";
import { ModernSidebar } from "@/components/ui/modern-sidebar";
import { ColorModeSwitcher } from "@/components/color-mode-switcher";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 -z-20">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

   

      <div className="flex h-screen">
        {/* Enhanced Sidebar */}
        <aside className="glass-card border-r border-border/50 backdrop-blur-xl">
          <ModernSidebar teamId={teamId} />
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          {/* Page content */}
          <div className="flex-1 p-4">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-96">
                  <div className="glass-card p-8 text-center">
                    <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Loading dashboard...
                    </p>
                  </div>
                </div>
              }
            >
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
