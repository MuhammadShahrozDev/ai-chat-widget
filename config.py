"""
AI Chat Widget — Configuration
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    MAX_HISTORY = 20
    TEMPERATURE = 0.7
    MAX_TOKENS = 1000
    
    @classmethod
    def is_valid(cls):
        return bool(cls.GROQ_API_KEY and cls.GROQ_API_KEY.startswith("gsk_"))


config = Config()