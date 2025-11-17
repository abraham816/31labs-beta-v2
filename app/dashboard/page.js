'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import AgentStudio from "@/components/AgentStudio";

export default function DashboardPage() {
  const router = useRouter();
  const [agentData, setAgentData] = useState({
    brandName: '',
    heroHeader: '',
    heroSubheader: '',
    productPills: [],
    products: []
  });

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      return;
    }
    
  }, [router]);

  const handleUpdateAgent = (updates) => {
    const newData = { ...agentData, ...updates };
    setAgentData(newData);
  };

  return (
    <AgentStudio
      agentData={agentData}
      onUpdateAgent={handleUpdateAgent}
      onBack={() => router.push('/')}
    />
  );
}
