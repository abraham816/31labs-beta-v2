from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain
import os

load_dotenv()
app = Flask(__name__)
CORS(app)

# LangChain setup
llm = ChatAnthropic(model="claude-sonnet-4-20250514", anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"))
conversations = {}  # Store conversations per session

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message')
    agent_data = data.get('agentData', {})
    build_context = data.get('buildContext', '')
    session_id = data.get('sessionId', 'default')
    
    # Initialize conversation if new
    if session_id not in conversations:
        conversations[session_id] = ConversationChain(
            llm=llm,
            memory=ConversationBufferMemory()
        )
    
    chain = conversations[session_id]
    
    if build_context:
        # Builder mode
        build_step = agent_data.get('buildStep', 0)
        prompt = f"""Context: {build_context}
Step {build_step + 1}/4. Brand: {agent_data.get('brandName', 'none')}
Guide user naturally, redirect if off-topic.

User: {user_message}"""
        response = chain.predict(input=prompt)
    else:
        # Shopping mode
        products = ', '.join([f"{p['name']} £{p['price']}" for p in agent_data.get('products', [])])
        prompt = f"""You're a sales assistant for {agent_data.get('brandName', 'store')}.
Products: {products or 'None'}
When asked to show products, say "Here are our products:"

Customer: {user_message}"""
        response = chain.predict(input=prompt)
    
    return jsonify({'response': response, 'showProducts': False, 'showCheckout': False})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
