"""
AI Chat Widget — Multi-Brand Chatbot Engine
Supports: Techxaone + EduLearn Academy
"""

from groq import Groq
from config import config
from knowledge_base import KNOWLEDGE_BASE as TECHXAONE_KB
from knowledge_edulearn import KNOWLEDGE_BASE as EDULEARN_KB
from typing import List, Dict, Generator


def get_system_prompt(brand: str = "techxaone") -> str:
    """Return system prompt based on brand"""
    
    if brand == "edulearn":
        brand_name = "EduLearn Academy"
        website = "EduLearn Academy"
        contact = "support via the website"
        kb = EDULEARN_KB
        scope = "courses, learning paths, certificates, payments, and how the academy works"
    else:
        brand_name = "Techxaone"
        website = "techxaone.com"
        contact = "contact@techxaone.com"
        kb = TECHXAONE_KB
        scope = "AI/ML services, pricing, portfolio, and how to hire"
    
    return f"""You are AIChat Pro, the official AI assistant for {brand_name} ({website}).

YOUR ROLE:
Help visitors with:
1. Questions about {brand_name} — {scope}
2. General questions related to the {brand_name}'s domain
3. Guidance on how to get started, pricing, and next steps

STRICT RULES:

1. ANSWER DIRECTLY. Do NOT add promotional text at the end of every response. Only mention {brand_name} when relevant to the answer.

2. For {brand_name}-specific questions: Use the KNOWLEDGE BASE below for accurate answers.

3. For general/educational questions related to the domain: Answer helpfully with your own knowledge.

4. For off-topic questions (news, politics, sports, personal questions, unrelated topics): Politely decline:
   "I'm here to help with questions about {brand_name}. For that question, please reach out at {contact}. How can I help you?"

5. Never claim to be ChatGPT, OpenAI, or any other AI.

6. Reply in the SAME language the user writes in (English, Urdu, Hindi, Arabic, etc.).

7. Be friendly, clear, and concise. Keep responses under 180 words.

8. Use emojis sparingly (max 1 per response).

9. Use markdown: **bold** for key terms, numbered lists, bullets. Do NOT use ## headers.

10. Never make up information. If you don't know: "I don't have that information. Please contact {contact}."

KNOWLEDGE BASE:
{kb}
"""


class Chatbot:
    def __init__(self, brand: str = "techxaone", system_prompt: str = None):
        if not config.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY not found")
        
        self.client = Groq(api_key=config.GROQ_API_KEY)
        self.model = config.GROQ_MODEL
        self.history: List[Dict] = []
        self.brand = brand
        self.system_prompt = system_prompt or get_system_prompt(brand)
    
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
    
    def clear_history(self):
        self.history = []