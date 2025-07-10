"use client";

import { use } from "react";
import { motion } from "framer-motion";
import { DepartmentsTab } from "../components/departments/departments-tab";
import { ConfigurationNavigation } from "../components/configuration-navigation";

interface DepartmentsPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default function DepartmentsPage({ params }: DepartmentsPageProps) {
  const { teamId } = use(params);

  return (
    <div className="space-y-8 p-6">
      <ConfigurationNavigation teamId={teamId} />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <DepartmentsTab teamId={teamId} />
      </motion.div>
    </div>
  );
}