"""
AI Chat Widget — FastAPI Backend
"""

from fastapi import FastAPI
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uuid
import json
import os

from chatbot import Chatbot
from config import config

app = FastAPI(title="AI Chat Widget", version="1.0.0")

# CORS — allow any website to embed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory sessions (use Redis in production)
sessions = {}


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "AI Chat Widget",
        "version": "1.0.0"
    }


@app.post("/api/chat/stream")
async def chat_stream(req: ChatRequest):
    session_id = req.session_id or str(uuid.uuid4())
    
    if session_id not in sessions:
        sessions[session_id] = Chatbot()
    
    bot = sessions[session_id]
    
    def generate():
        # Send session ID first
        yield f"data: {json.dumps({'type': 'session', 'session_id': session_id})}\n\n"
        
        try:
            for chunk in bot.stream_chat(req.message):
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


@app.get("/widget.js")
def widget_js():
    return FileResponse(
        "widget/widget.js",
        media_type="application/javascript",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600",
        }
    )


@app.get("/demo")
def demo():
    return FileResponse("widget/demo.html", media_type="text/html")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)