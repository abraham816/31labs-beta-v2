'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AgentStudio } from "@/components/AgentStudio";
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [agentData, setAgentData] = useState({
    brandName: '',
    heroHeader: '',
    heroSubheader: '',
    products: [],
    productPills: [],
    backgroundImage: '',
    salesTone: 'friendly',
    agentType: 'eCommerce'
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-neutral-100 flex items-center justify-center">Loading...</div>;

  return (
    <AgentStudio
      agentData={agentData}
      onBack={() => router.push('/')}
      onUpdateAgent={(updates) => setAgentData({ ...agentData, ...updates })}
    />
  );
}
