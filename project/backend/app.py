from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import anthropic
import os

load_dotenv()
app = Flask(__name__)
CORS(app)
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message')
    agent_data = data.get('agentData', {})
    conversation_history = data.get('conversationHistory', [])
    build_context = data.get('buildContext', '')
    is_builder = build_context != ''
    
    if is_builder:
        build_step = agent_data.get('buildStep', 0)
        system_prompt = f"""You are helping users build their business agent. Current step: {build_step + 1}/5. {build_context}. Guide them naturally but keep them on track. If their answer doesn't fit the current question, politely redirect."""
        
        messages = []
        for msg in conversation_history[-4:]:
            if msg.get('role') in ['user', 'assistant']:
                messages.append({"role": msg['role'], "content": msg['content']})
        messages.append({"role": "user", "content": user_message})
        
        response = client.messages.create(model="claude-sonnet-4-20250514", max_tokens=1024, messages=messages, system=system_prompt)
        return jsonify({'response': response.content[0].text, 'showProducts': False, 'showCheckout': False})
    else:
        products = agent_data.get('products', [])
        product_list = ', '.join([p['name'] + ' £' + str(p['price']) for p in products]) if products else 'None'
        context = f"Sales assistant for {agent_data.get('brandName', 'store')}. Products: {product_list}"
        response = client.messages.create(model="claude-sonnet-4-20250514", max_tokens=1024, messages=[{"role": "user", "content": user_message}], system=context)
        return jsonify({'response': response.content[0].text, 'showProducts': False, 'showCheckout': False})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
