import { supabase } from './supabase';

export async function saveAgent(userId, agentData, chatHistory = []) {
  const { data, error } = await supabase
    .from('agents')
    .upsert({
      user_id: userId,
      brand_name: agentData.brandName || '',
      hero_header: agentData.heroHeader || '',
      hero_subheader: agentData.heroSubheader || '',
      hero_color: agentData.heroColor || '#171717',
      hero_text_size: agentData.heroTextSize || 'text-6xl',
      hero_weight: agentData.heroWeight || 'font-normal',
      subheader_color: agentData.subheaderColor || '#525252',
      subheader_text_size: agentData.subheaderTextSize || 'text-xl',
      subheader_weight: agentData.subheaderWeight || 'font-normal',
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
    .single();
  
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
        heroColor: data.hero_color || '#171717',
        heroTextSize: data.hero_text_size || 'text-6xl',
        heroWeight: data.hero_weight || 'font-normal',
        subheaderColor: data.subheader_color || '#525252',
        subheaderTextSize: data.subheader_text_size || 'text-xl',
        subheaderWeight: data.subheader_weight || 'font-normal',
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