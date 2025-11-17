from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import anthropic
import os
from supabase import create_client

load_dotenv()
app = Flask(__name__)
CORS(app)
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message')
    agent_data = data.get('agentData', {})
    build_context = data.get('buildContext', '')
    
    if build_context:
        system_prompt = f"Guide user building business agent. {build_context}. Redirect if off-topic."
        response = client.messages.create(model="claude-sonnet-4-20250514", max_tokens=1024, messages=[{"role": "user", "content": user_message}], system=system_prompt)
        return jsonify({'response': response.content[0].text})
    else:
        products = ', '.join([p['name'] + ' £' + str(p['price']) for p in agent_data.get('products', [])])
        response = client.messages.create(model="claude-sonnet-4-20250514", max_tokens=1024, messages=[{"role": "user", "content": user_message}], system=f"Sales assistant for {agent_data.get('brandName', 'store')}. Products: {products}")
        return jsonify({'response': response.content[0].text})

@app.route('/api/agents', methods=['POST'])
def save_agent():
    data = request.json
    result = supabase.table('agents').insert({
        'brand_name': data['brandName'],
        'hero_header': data.get('heroHeader'),
        'hero_subheader': data.get('heroSubheader'),
        'products': data.get('products', []),
        'sales_tone': data.get('salesTone')
    }).execute()
    return jsonify(result.data[0])

@app.route('/api/agents/<brand_name>', methods=['GET'])
def get_agent(brand_name):
    result = supabase.table('agents').select('*').ilike('brand_name', brand_name).execute()
    if result.data:
        return jsonify(result.data[0])
    return jsonify({'error': 'Not found'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
