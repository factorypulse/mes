"use client";

import { use } from "react";
import { motion } from "framer-motion";
import { APIKeysList } from "../components/api-keys/api-keys-list";
import { ConfigurationNavigation } from "../components/configuration-navigation";

interface APIKeysPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default function APIKeysPage({ params }: APIKeysPageProps) {
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
        <APIKeysList teamId={teamId} />
      </motion.div>
    </div>
  );
}