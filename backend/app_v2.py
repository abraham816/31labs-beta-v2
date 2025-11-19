from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import anthropic
import os
import json
from datetime import datetime
from supabase import create_client
from typing import Dict, Any, Optional
import uuid

load_dotenv()
app = Flask(__name__)
CORS(app)

# Initialize clients
claude_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
supabase = create_client(
    os.getenv("SUPABASE_URL"), 
    os.getenv("SUPABASE_SERVICE_KEY")
)

# State machine definition
BUILDER_STATES = {
    'start': 'Getting business idea',
    'clarify': 'Clarifying details',
    'brand': 'Creating brand identity',
    'hero': 'Crafting hero section',
    'products': 'Adding products',
    'style': 'Setting style/tone',
    'preview': 'Ready to preview',
    'publish': 'Published'
}

# State transitions
STATE_TRANSITIONS = {
    'start': ['clarify', 'brand'],
    'clarify': ['brand', 'hero'],
    'brand': ['hero'],
    'hero': ['products'],
    'products': ['style'],
    'style': ['preview'],
    'preview': ['publish', 'products', 'hero', 'brand'],
    'publish': ['preview']
}

class AgentBuilder:
    """Manages the AI-driven agent building process"""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.agent_id = None
        self.context = {}
        self.load_or_create_agent()
    
    def load_or_create_agent(self):
        """Load existing agent or create new one"""
        try:
            # Try to get existing agent for this user
            result = supabase.table('agents').select('*').eq(
                'user_id', self.user_id
            ).order('updated_at.desc').limit(1).execute()
            
            if result.data and len(result.data) > 0:
                agent_data = result.data[0]
                self.agent_id = agent_data['id']
                self.context = {
                    'state': agent_data.get('state', 'start'),
                    'brand_name': agent_data.get('brand_name', ''),
                    'hero_header': agent_data.get('hero_header', ''),
                    'hero_subheader': agent_data.get('hero_subheader', ''),
                    'products': agent_data.get('products', []),
                    'product_pills': agent_data.get('product_pills', []),
                    'background_image': agent_data.get('background_image', ''),
                    'sales_tone': agent_data.get('sales_tone', 'friendly'),
                    'agent_type': agent_data.get('agent_type', 'eCommerce'),
                    'conversation_history': agent_data.get('conversation_history', [])
                }
            else:
                # Create new agent
                self.agent_id = str(uuid.uuid4())
                self.context = {
                    'state': 'start',
                    'brand_name': '',
                    'hero_header': '',
                    'hero_subheader': '',
                    'products': [],
                    'product_pills': [],
                    'background_image': '',
                    'sales_tone': 'friendly',
                    'agent_type': 'eCommerce',
                    'conversation_history': []
                }
                self.save_context()
        except Exception as e:
            print(f"Error loading/creating agent: {e}")
            # Start fresh on error
            self.agent_id = str(uuid.uuid4())
            self.context = {
                'state': 'start',
                'brand_name': '',
                'hero_header': '',
                'hero_subheader': '',
                'products': [],
                'product_pills': [],
                'background_image': '',
                'sales_tone': 'friendly',
                'agent_type': 'eCommerce',
                'conversation_history': []
            }
    
    def save_context(self):
        """Save context to Supabase"""
        try:
            data_to_save = {
                'id': self.agent_id,
                'user_id': self.user_id,
                'state': self.context.get('state', 'start'),
                'brand_name': self.context.get('brand_name', ''),
                'hero_header': self.context.get('hero_header', ''),
                'hero_subheader': self.context.get('hero_subheader', ''),
                'products': self.context.get('products', []) or [],
                'product_pills': self.context.get('product_pills', []),
                'background_image': self.context.get('background_image', ''),
                'sales_tone': self.context.get('sales_tone', 'friendly'),
                'agent_type': self.context.get('agent_type', 'eCommerce'),
                'conversation_history': self.context.get('conversation_history', []),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # Use upsert to handle both insert and update
            result = supabase.table('agents').upsert(
                data_to_save,
                on_conflict='id'
            ).execute()
            
            return True
        except Exception as e:
            print(f"Error saving context: {e}")
            return False
    
    def process_message(self, user_message: str) -> Dict[str, Any]:
        """Process user message through Claude with state management"""
        
        # Add to conversation history
        self.context['conversation_history'].append({
            'role': 'user',
            'content': user_message,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Get last 80% of conversation for context
        history_size = len(self.context['conversation_history'])
        start_index = max(0, int(history_size * 0.2))
        recent_history = self.context['conversation_history'][start_index:]
        
        # Build conversation context
        conv_context = ""
        for msg in recent_history[-10:]:
            conv_context += f"{msg['role']}: {msg['content'][:100]}\n"
        
        # Build current state summary
        products_summary = ', '.join([f"{p['name']}:${p.get('price', 0)}" for p in self.context.get('products', []) or []])[:200]
        
        # Compact but comprehensive prompt
        system_prompt = f"""You're building an eCommerce agent. Current state: {self.context['state']}

Current build:
Brand: {self.context.get('brand_name', 'Not set')}
Header: {self.context.get('hero_header', 'Not set')}
Subheader: {self.context.get('hero_subheader', 'Not set')}
Products: {products_summary if products_summary else 'None'}
Background: ${self.context.get('background_image', '')}
Tone: {self.context.get('sales_tone', 'friendly')}

Recent conversation:
{conv_context}

Parse the user's message and extract any business details. Guide them naturally through building their agent.
Return JSON: {{"updated_fields": {{"brand_name": null, "hero_header": null, "hero_subheader": null, "products": null, "sales_tone": null}}, "next_state": "{self.context['state']}", "ai_response": "your response"}}

Examples:
- "I want to sell tea" → Ask about brand name, suggest options
- "Call it TeaTime" → Set brand_name: "TeaTime", ask about headline
- "Add matcha $25" → Add to products array
- "Change name to X" → Update brand_name to X"""
        
        try:
            # Call Claude API with Haiku
            response = claude_client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=1000,
                temperature=0.3,
                messages=[
                    {"role": "user", "content": user_message}
                ],
                system=system_prompt
            )
            
            # Parse Claude's response
            response_text = response.content[0].text
            
            # Try to extract JSON from response
            try:
                import re
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group())
                else:
                    result = {
                        "updated_fields": {},
                        "next_state": self.context['state'],
                        "ai_response": response_text,
                        "needs_clarification": False
                    }
            except:
                result = {
                    "updated_fields": {},
                    "next_state": self.context['state'],
                    "ai_response": response_text,
                    "needs_clarification": False
                }
            
            # Update context with extracted fields
            if result.get('updated_fields'):
                for key, value in result['updated_fields'].items():
                    if value is not None:
                        if key == 'products' and value:
                            self.context['products'] = value
                            self.context['product_pills'] = [
                                {'name': p['name'], 'image': p.get('image', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400')}
                                for p in value
                            ]
                        else:
                            self.context[key] = value
            
            # Update state
            if result.get('next_state'):
                self.context['state'] = result['next_state']
            
            # Add AI response to history
            self.context['conversation_history'].append({
                'role': 'assistant',
                'content': result.get('ai_response', ''),
                'timestamp': datetime.utcnow().isoformat()
            })
            
            # Save to database
            self.save_context()
            
            return {
                'success': True,
                'response': result.get('ai_response', ''),
                'context': {
                    'state': self.context['state'],
                    'brandName': self.context.get('brand_name', ''),
                    'heroHeader': self.context.get('hero_header', ''),
                    'heroSubheader': self.context.get('hero_subheader', ''),
                    'products': self.context.get('products', []) or [],
                    'productPills': self.context.get('product_pills', []),
                    'backgroundImage': self.context.get('background_image', ''),
                    'salesTone': self.context.get('sales_tone', 'friendly'),
                    'agentType': self.context.get('agent_type', 'eCommerce')
                },
                'updated_fields': result.get('updated_fields', {})
            }
            
        except Exception as e:
            print(f"Error processing message: {e}")
            return {
                'success': False,
                'error': str(e),
                'response': "I had trouble understanding that. Could you try rephrasing?",
                'context': self.context
            }

# Global storage for builder instances
builders = {}

@app.route('/api/builder/chat', methods=['POST'])
def builder_chat():
    """Handle builder chat messages"""
    data = request.json
    user_id = data.get('user_id')
    message = data.get('message')
    
    if not user_id or not message:
        return jsonify({'error': 'Missing user_id or message'}), 400
    
    if user_id not in builders:
        builders[user_id] = AgentBuilder(user_id)
    
    builder = builders[user_id]
    result = builder.process_message(message)
    
    return jsonify(result)

@app.route('/api/builder/reset', methods=['POST'])
def reset_builder():
    """Reset builder for a user"""
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400
    
    builders[user_id] = AgentBuilder(user_id)
    builders[user_id].context = {
        'state': 'start',
        'brand_name': '',
        'hero_header': '',
        'hero_subheader': '',
        'products': [],
        'product_pills': [],
        'background_image': '',
        'sales_tone': 'friendly',
        'agent_type': 'eCommerce',
        'conversation_history': []
    }
    builders[user_id].save_context()
    
    return jsonify({'success': True, 'message': 'Builder reset successfully'})

@app.route('/api/builder/context/<user_id>', methods=['GET'])
def get_context(user_id):
    """Get current context for a user"""
    if user_id not in builders:
        builders[user_id] = AgentBuilder(user_id)
    
    return jsonify({
        'context': builders[user_id].context,
        'state': builders[user_id].context.get('state', 'start')
    })

@app.route('/api/builder/process', methods=['POST'])
def process_builder():
    """Process builder with XState"""
    data = request.json
    state = data.get('state', 'idle')
    message = data.get('message')
    user_id = data.get('user_id')
    
    if user_id not in builders:
        builders[user_id] = AgentBuilder(user_id)
    
    result = builders[user_id].process_message(message)
    
    state_map = {
        'idle': 'START',
        'intake': 'SUBMIT', 
        'clarify': 'ANSWER',
        'generate': 'DONE',
        'preview': 'SAVE'
    }
    
    return jsonify({
        'response': result['response'],
        'transition': state_map.get(state, 'START'),
        'updates': result.get('context', {})
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle shopping agent chat"""
    data = request.json
    user_message = data.get('message')
    agent_data = data.get('agentData', {})
    
    products_str = ', '.join([
        f"{p['name']} £{p['price']}" 
        for p in agent_data.get('products', [])
    ])
    
    system_prompt = f"""You are a sales assistant for {agent_data.get('brandName', 'this store')}. 
    Products available: {products_str}
    Background: ${self.context.get('background_image', '')}
Tone: {agent_data.get('salesTone', 'friendly')}
    Help customers find products and make purchases."""
    
    response = claude_client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=1000,
        messages=[{"role": "user", "content": user_message}],
        system=system_prompt
    )
    
    return jsonify({'response': response.content[0].text})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))