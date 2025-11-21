from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import anthropic
import os
from datetime import datetime
from supabase import create_client
from typing import Dict, Any
import uuid

load_dotenv()
app = Flask(__name__)
CORS(app)

claude_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

class AgentBuilder:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.agent_id = None
        self.context = {}
        self.load_or_create_agent()
    
    def load_or_create_agent(self):
        try:
            result = supabase.table('agents').select('*').eq('user_id', self.user_id).order('updated_at.desc').limit(1).execute()
            
            if result.data and len(result.data) > 0:
                agent_data = result.data[0]
                self.agent_id = agent_data['id']
                self.context = {
                    'state': agent_data.get('state', 'start'),
                    'brand_name': agent_data.get('brand_name', ''),
                    'hero_header': agent_data.get('hero_header', ''),
                    'hero_subheader': agent_data.get('hero_subheader', ''),
                    'hero_color': agent_data.get('hero_color', '#171717'),
                    'hero_text_size': agent_data.get('hero_text_size', 'text-2xl'),
                    'subheader_color': agent_data.get('subheader_color', '#525252'),
                    'subheader_text_size': agent_data.get('subheader_text_size', 'text-sm'),
                    'products': agent_data.get('products', []) or [],
                    'product_pills': agent_data.get('product_pills', []) or [],
                    'background_image': agent_data.get('background_image', ''),
                    'sales_tone': agent_data.get('sales_tone', 'friendly'),
                    'agent_type': agent_data.get('agent_type', 'eCommerce'),
                    'conversation_history': agent_data.get('conversation_history', [])
                }
            else:
                self.agent_id = str(uuid.uuid4())
                self.context = {
                    'state': 'start', 'brand_name': '', 'hero_header': '', 'hero_subheader': '',
                    'hero_color': '#171717', 'hero_text_size': 'text-2xl',
                    'subheader_color': '#525252', 'subheader_text_size': 'text-sm',
                    'products': [], 'product_pills': [], 'background_image': '',
                    'sales_tone': 'friendly', 'agent_type': 'eCommerce', 'conversation_history': []
                }
                self.save_context()
        except Exception as e:
            print(f"Error: {e}")
            self.agent_id = str(uuid.uuid4())
            self.context = {
                'state': 'start', 'brand_name': '', 'hero_header': '', 'hero_subheader': '',
                'hero_color': '#171717', 'hero_text_size': 'text-2xl',
                'subheader_color': '#525252', 'subheader_text_size': 'text-sm',
                'products': [], 'product_pills': [], 'background_image': '',
                'sales_tone': 'friendly', 'agent_type': 'eCommerce', 'conversation_history': []
            }
    
    def save_context(self):
        try:
            data_to_save = {
                'id': self.agent_id, 'user_id': self.user_id,
                'state': self.context.get('state', 'start'),
                'brand_name': self.context.get('brand_name', ''),
                'hero_header': self.context.get('hero_header', ''),
                'hero_subheader': self.context.get('hero_subheader', ''),
                'hero_color': self.context.get('hero_color', '#171717'),
                'hero_text_size': self.context.get('hero_text_size', 'text-2xl'),
                'subheader_color': self.context.get('subheader_color', '#525252'),
                'subheader_text_size': self.context.get('subheader_text_size', 'text-sm'),
                'products': self.context.get('products', []) or [],
                'product_pills': self.context.get('product_pills', []) or [],
                'background_image': self.context.get('background_image', ''),
                'sales_tone': self.context.get('sales_tone', 'friendly'),
                'agent_type': self.context.get('agent_type', 'eCommerce'),
                'conversation_history': self.context.get('conversation_history', []),
                'updated_at': datetime.utcnow().isoformat()
            }
            supabase.table('agents').upsert(data_to_save, on_conflict='id').execute()
            return True
        except Exception as e:
            print(f"Save error: {e}")
            return False
    
    def process_message(self, user_message: str) -> Dict[str, Any]:
        self.context['conversation_history'].append({
            'role': 'user', 'content': user_message, 'timestamp': datetime.utcnow().isoformat()
        })
        
        recent_history = self.context['conversation_history'][-10:]
        conv_context = "\n".join([f"{m['role']}: {m['content'][:100]}" for m in recent_history])
        products_summary = ', '.join([f"{p['name']}:${p.get('price', 0)}" for p in self.context.get('products', []) or []])[:200]
        
        system_prompt = f"""You're building an eCommerce agent.

CRITICAL RULES - READ CAREFULLY:
1. "hero text color" or "hero color" → ONLY update hero_color field (hex color)
2. "subheader color" → ONLY update subheader_color field (hex color)  
3. "background" or "background image" → ONLY update background_image field (URL or empty string)
4. NEVER EVER set background_image when user says "color" or "text"
5. NEVER EVER set hero_color/subheader_color to URLs or empty strings

Current build:
Brand: {self.context.get('brand_name', 'Not set')}
Header: {self.context.get('hero_header', 'Not set')}
Subheader: {self.context.get('hero_subheader', 'Not set')}
Hero Color: {self.context.get('hero_color', '#171717')}
Hero Size: {self.context.get('hero_text_size', 'text-2xl')}
Subheader Color: {self.context.get('subheader_color', '#525252')}
Products: {products_summary or 'None'}
Background Image: {self.context.get('background_image', 'Not set')}

{conv_context}

Return JSON: {{"updated_fields": {{"brand_name": null, "hero_header": null, "hero_subheader": null, "hero_color": null, "hero_text_size": null, "subheader_color": null, "subheader_text_size": null, "background_image": null, "products": null}}, "next_state": "{self.context['state']}", "ai_response": "your response"}}

Examples:
- "Make hero text blue" → {{"hero_color": "#3B82F6"}}
- "Hero text white" → {{"hero_color": "#FFFFFF"}}
- "Change hero to black" → {{"hero_color": "#000000"}}
- "Subheader red" → {{"subheader_color": "#EF4444"}}
- "Remove background" → {{"background_image": ""}}
- "Background image URL" → {{"background_image": "https://..."}}
- "Add Green Tea $25" → {{"products": [{{"name": "Green Tea", "price": 25}}]}}"""
        
        try:
            response = claude_client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=1000,
                temperature=0.3,
                messages=[{"role": "user", "content": user_message}],
                system=system_prompt
            )
            
            response_text = response.content[0].text
            
            try:
                import re
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                result = json.loads(json_match.group()) if json_match else {
                    "updated_fields": {}, "next_state": self.context['state'], "ai_response": response_text
                }
            except:
                result = {"updated_fields": {}, "next_state": self.context['state'], "ai_response": response_text}
            
            # STRICT VALIDATION
            if result.get('updated_fields'):
                for key, value in result['updated_fields'].items():
                    if value is None:
                        continue
                    
                    # Prevent color/background confusion
                    if key in ['hero_color', 'subheader_color']:
                        if not (isinstance(value, str) and (value.startswith('#') or value in ['red', 'blue', 'white', 'black', 'green'])):
                            print(f"BLOCKED: Tried to set {key} to invalid value: {value}")
                            continue
                    
                    if key == 'background_image':
                        if isinstance(value, str) and value.startswith('#'):
                            print(f"BLOCKED: Tried to set background_image to hex color: {value}")
                            continue
                    
                    # Apply valid updates
                    if key == 'products' and value:
                        if isinstance(value, list):
                            self.context['products'] = value
                            self.context['product_pills'] = [
                                {'name': p.get('name', 'Product'), 'image': p.get('image', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400')}
                                for p in value
                            ]
                    else:
                        self.context[key] = value
            
            if result.get('next_state'):
                self.context['state'] = result['next_state']
            
            self.context['conversation_history'].append({
                'role': 'assistant', 'content': result.get('ai_response', ''), 'timestamp': datetime.utcnow().isoformat()
            })
            
            self.save_context()
            
            return {
                'success': True,
                'response': result.get('ai_response', ''),
                'context': {
                    'state': self.context['state'],
                    'brandName': self.context.get('brand_name', ''),
                    'heroHeader': self.context.get('hero_header', ''),
                    'heroSubheader': self.context.get('hero_subheader', ''),
                    'heroColor': self.context.get('hero_color', '#171717'),
                    'heroTextSize': self.context.get('hero_text_size', 'text-2xl'),
                    'subheaderColor': self.context.get('subheader_color', '#525252'),
                    'subheaderTextSize': self.context.get('subheader_text_size', 'text-sm'),
                    'products': self.context.get('products', []) or [],
                    'productPills': self.context.get('product_pills', []) or [],
                    'backgroundImage': self.context.get('background_image', ''),
                    'salesTone': self.context.get('sales_tone', 'friendly'),
                    'agentType': self.context.get('agent_type', 'eCommerce')
                },
                'updated_fields': result.get('updated_fields', {})
            }
        except Exception as e:
            print(f"Error: {e}")
            return {
                'success': False, 'error': str(e),
                'response': "I had trouble understanding that. Could you try rephrasing?",
                'context': {
                    'brandName': self.context.get('brand_name', ''),
                    'heroHeader': self.context.get('hero_header', ''),
                    'heroSubheader': self.context.get('hero_subheader', ''),
                    'heroColor': self.context.get('hero_color', '#171717'),
                    'heroTextSize': self.context.get('hero_text_size', 'text-2xl'),
                    'subheaderColor': self.context.get('subheader_color', '#525252'),
                    'subheaderTextSize': self.context.get('subheader_text_size', 'text-sm'),
                    'products': self.context.get('products', []) or [],
                    'productPills': self.context.get('product_pills', []) or [],
                    'backgroundImage': self.context.get('background_image', ''),
                    'salesTone': self.context.get('sales_tone', 'friendly'),
                    'agentType': self.context.get('agent_type', 'eCommerce')
                }
            }

builders = {}

@app.route('/api/builder/chat', methods=['POST'])
def builder_chat():
    data = request.json
    user_id = data.get('user_id')
    message = data.get('message')
    if not user_id or not message:
        return jsonify({'error': 'Missing user_id or message'}), 400
    if user_id not in builders:
        builders[user_id] = AgentBuilder(user_id)
    result = builders[user_id].process_message(message)
    return jsonify(result)

@app.route('/api/builder/reset', methods=['POST'])
def reset_builder():
    data = request.json
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400
    builders[user_id] = AgentBuilder(user_id)
    builders[user_id].context = {
        'state': 'start', 'brand_name': '', 'hero_header': '', 'hero_subheader': '',
        'hero_color': '#171717', 'hero_text_size': 'text-2xl',
        'subheader_color': '#525252', 'subheader_text_size': 'text-sm',
        'products': [], 'product_pills': [], 'background_image': '',
        'sales_tone': 'friendly', 'agent_type': 'eCommerce', 'conversation_history': []
    }
    builders[user_id].save_context()
    return jsonify({'success': True, 'message': 'Builder reset successfully'})

@app.route('/api/builder/context/<user_id>', methods=['GET'])
def get_context(user_id):
    if user_id not in builders:
        builders[user_id] = AgentBuilder(user_id)
    return jsonify({'context': builders[user_id].context, 'state': builders[user_id].context.get('state', 'start')})

@app.route('/api/builder/process', methods=['POST'])
def process_builder():
    data = request.json
    user_id = data.get('user_id')
    message = data.get('message')
    if user_id not in builders:
        builders[user_id] = AgentBuilder(user_id)
    result = builders[user_id].process_message(message)
    return jsonify({
        'response': result['response'],
        'transition': 'START',
        'updates': result.get('context', {}),
        'context': result.get('context', {})
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message')
    agent_data = data.get('agentData', {})
    products_str = ', '.join([f"{p['name']} ${p['price']}" for p in agent_data.get('products', [])])
    system_prompt = f"""You are a sales assistant for {agent_data.get('brandName', 'this store')}. 
Products: {products_str}
Tone: {agent_data.get('salesTone', 'friendly')}
Help customers find products."""
    try:
        response = claude_client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            messages=[{"role": "user", "content": user_message}],
            system=system_prompt
        )
        return jsonify({'response': response.content[0].text})
    except:
        return jsonify({'response': "I'm having trouble. Please try again."}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))