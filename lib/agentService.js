import { supabase } from './supabase';

export async function saveAgent(userId, agentData, chatHistory = []) {
  const { data, error } = await supabase
    .from('agents')
    .upsert({
      user_id: userId,
      brand_name: agentData.brandName || '',
      hero_header: agentData.heroHeader || '',
      hero_subheader: agentData.heroSubheader || '',
      products: agentData.products || [],
      product_pills: agentData.productPills || [],
      background_image: agentData.backgroundImage || '',
      sales_tone: agentData.salesTone || 'friendly',
      agent_type: agentData.agentType || 'eCommerce',
      conversation_history: chatHistory || [],
      updated_at: new Date().toISOString()
    });
  
  if (error) console.error('Save error:', error);
  return { data, error };
}

export async function loadAgent(userId) {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('Load error:', error);
    return null;
  }
  
  if (data) {
    return {
      agent: {
        brandName: data.brand_name || '',
        heroHeader: data.hero_header || '',
        heroSubheader: data.hero_subheader || '',
        products: data.products || [],
        productPills: data.product_pills || [],
        backgroundImage: data.background_image || '',
        salesTone: data.sales_tone || 'friendly',
        agentType: data.agent_type || 'eCommerce'
      },
      chatHistory: data.conversation_history || []
    };
  }
  return null;
}
