"""
AI Chat Widget — Chatbot Engine (Groq)
"""

from groq import Groq
from config import config
from typing import List, Dict, Generator


class Chatbot:
    def __init__(self, system_prompt: str = None):
        if not config.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY not found")
        
        self.client = Groq(api_key=config.GROQ_API_KEY)
        self.model = config.GROQ_MODEL
        self.history: List[Dict] = []
        
        self.system_prompt = system_prompt or (
            "You are a helpful, friendly AI assistant on a website. "
            "Answer customer questions clearly and concisely. "
            "If you don't know something, politely say so. "
            "Keep responses short and helpful. "
            "Never claim to be ChatGPT or OpenAI."
        )
    
    def _build_messages(self, user_message: str) -> List[Dict]:
        messages = [{"role": "system", "content": self.system_prompt}]
        messages.extend(self.history[-config.MAX_HISTORY:])
        messages.append({"role": "user", "content": user_message})
        return messages
    
    def stream_chat(self, user_message: str) -> Generator[str, None, None]:
        stream = self.client.chat.completions.create(
            model=self.model,
            messages=self._build_messages(user_message),
            temperature=config.TEMPERATURE,
            max_tokens=config.MAX_TOKENS,
            stream=True,
        )
        
        full = ""
        for chunk in stream:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                full += content
                yield content
        
        self.history.append({"role": "user", "content": user_message})
        self.history.append({"role": "assistant", "content": full})