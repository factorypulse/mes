"use client";

import { use } from "react";
import { motion } from "framer-motion";
import { UsersTab } from "../components/users/users-tab";
import { ConfigurationNavigation } from "../components/configuration-navigation";

interface UsersPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default function UsersPage({ params }: UsersPageProps) {
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
        <UsersTab teamId={teamId} />
      </motion.div>
    </div>
  );
}