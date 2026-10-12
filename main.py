"""
AI Chat Widget — Flask Backend (Multi-Brand)
"""

from flask import Flask, request, Response, jsonify, send_from_directory
import uuid
import json

from chatbot import Chatbot
from config import config

app = Flask(__name__)


@app.after_request
def add_cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response


# sessions[brand][session_id] = Chatbot instance
sessions = {"techxaone": {}, "edulearn": {}}


@app.route('/')
def root():
    return jsonify({
        "status": "online",
        "service": "AI Chat Widget",
        "version": "3.0.0",
        "brands": ["techxaone", "edulearn"]
    })


@app.route('/api/chat/stream', methods=['POST', 'OPTIONS'])
def chat_stream():
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json() or {}
    message = data.get('message', '').strip()
    session_id = data.get('session_id') or str(uuid.uuid4())
    brand = (data.get('brand') or 'techxaone').lower()
    
    if brand not in sessions:
        brand = 'techxaone'
    
    if not message:
        return jsonify({'error': 'Empty message'}), 400
    
    if session_id not in sessions[brand]:
        sessions[brand][session_id] = Chatbot(brand=brand)
    
    bot = sessions[brand][session_id]
    
    def generate():
        yield f"data: {json.dumps({'type': 'session', 'session_id': session_id})}\n\n"
        try:
            for chunk in bot.stream_chat(message):
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
    
    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive',
        }
    )


@app.route('/widget.js')
def widget_js():
    return send_from_directory('widget', 'widget.js', mimetype='application/javascript')


@app.route('/demo')
def demo():
    return send_from_directory('widget', 'demo.html', mimetype='text/html')


@app.route('/demo-edulearn')
def demo_edulearn():
    return send_from_directory('widget', 'demo-edulearn.html', mimetype='text/html')


if __name__ == '__main__':
    app.run(debug=True, port=8000)