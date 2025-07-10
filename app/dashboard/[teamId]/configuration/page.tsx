"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConfigurationNavigation } from "./components/configuration-navigation";

interface ConfigurationPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default function ConfigurationPage({ params }: ConfigurationPageProps) {
  const { teamId } = use(params);
  const router = useRouter();

  useEffect(() => {
    // Redirect to departments by default
    router.replace(`/dashboard/${teamId}/configuration/departments`);
  }, [teamId, router]);

  return (
    <div className="space-y-8 p-6">
      <ConfigurationNavigation teamId={teamId} />
    </div>
  );
}
