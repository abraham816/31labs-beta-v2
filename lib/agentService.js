import { supabase } from './supabase';

export async function saveAgent(userId, agentData, chatHistory = []) {
  const { data, error } = await supabase
    .from('agents')
    .upsert({
      user_id: userId,
      brand_name: agentData.brandName,
      hero_header: agentData.heroHeader,
      hero_subheader: agentData.heroSubheader,
      products: agentData.products,
      product_pills: agentData.productPills,
      background_image: agentData.backgroundImage,
      sales_tone: agentData.salesTone,
      agent_type: agentData.agentType,
      conversation_history: chatHistory,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  
  return { data, error };
}

export async function loadAgent(userId) {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (data) {
    return {
      agent: {
        brandName: data.brand_name,
        heroHeader: data.hero_header,
        heroSubheader: data.hero_subheader,
        products: data.products,
        productPills: data.product_pills,
        backgroundImage: data.background_image,
        salesTone: data.sales_tone,
        agentType: data.agent_type
      },
      chatHistory: data.conversation_history || []
    };
  }
  return null;
}
