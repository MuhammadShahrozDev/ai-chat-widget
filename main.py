"""
AI Chat Widget — Flask Backend
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


sessions = {}


@app.route('/')
def root():
    return jsonify({
        "status": "online",
        "service": "Techxaone AI Chat Widget",
        "version": "2.0.0"
    })


@app.route('/api/chat/stream', methods=['POST', 'OPTIONS'])
def chat_stream():
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json() or {}
    message = data.get('message', '').strip()
    session_id = data.get('session_id') or str(uuid.uuid4())
    
    if not message:
        return jsonify({'error': 'Empty message'}), 400
    
    if session_id not in sessions:
        sessions[session_id] = Chatbot()
    
    bot = sessions[session_id]
    
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


if __name__ == '__main__':
    app.run(debug=True, port=8000)