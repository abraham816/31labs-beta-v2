'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AgentStudio } from "@/components/AgentStudio";
import { supabase } from '@/lib/supabase';
import { loadAgent, saveAgent } from '@/lib/agentService';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
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
      setUserId(session.user.id);
      const saved = await loadAgent(session.user.id);
      if (saved) {
        setAgentData(saved.agent);
        setChatHistory(saved.chatHistory);
      }
      setLoading(false);
    }
  };

  const handleUpdateAgent = async (updates, newChatHistory) => {
    const newData = { ...agentData, ...updates };
    setAgentData(newData);
    if (newChatHistory) setChatHistory(newChatHistory);
    if (userId) {
      await saveAgent(userId, newData, newChatHistory || chatHistory);
    }
  };

  if (loading) return <div className="min-h-screen bg-neutral-100 flex items-center justify-center">Loading...</div>;

  return (
    <AgentStudio
      agentData={agentData}
      initialChatHistory={chatHistory}
      onBack={() => router.push('/')}
      onUpdateAgent={handleUpdateAgent}
    />
  );
}
