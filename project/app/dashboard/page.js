'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const AgentStudio = dynamic(() => import("@/components/AgentStudio_backup"), { ssr: false });

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
      router.push('/login');
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
