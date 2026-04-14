"""
NexLoan AI Engine — Groq API Integration
Handles chatbot interactions via Groq LLM. KYC/OCR moved to ocr_service.py.
"""

import logging
import json

from groq import AsyncGroq
from app.config import settings

logger = logging.getLogger("nexloan.ai")

# Initialize global AsyncGroq client
groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)


def _clean_json_response(res_text: str) -> str:
    """Removes markdown code blocks to ensure safe JSON parsing."""
    res_text = res_text.strip()
    if res_text.startswith("```json"):
        res_text = res_text[7:]
    elif res_text.startswith("```"):
        res_text = res_text[3:]
        
    if res_text.endswith("```"):
        res_text = res_text[:-3]
        
    return res_text.strip()


# Removed vision and name match routes. Mapped to local OCR service now.
async def chat(messages: list, loan_context: dict = None) -> str:
    """
    General chatbot handler using Groq.
    
    Args:
        messages: List of message dicts [{"role": "user/assistant", "content": "..."}]
        loan_context: Optional dictionary with loan details for authenticated users
    """
    try:
        system_prompt = """You are NexBot, a professional customer support assistant for NexLoan, a personal loan origination platform in India. You represent the brand: "NexLoan — Powered by Theoremlabs".

CRITICAL RULES (NEVER BREAK THESE):
1. You MUST respond ONLY in English. NEVER use Hindi, Hinglish, Devanagari script, or any non-English language. Even if the user writes in Hindi, you MUST reply in English only. This is a strict, non-negotiable requirement.
2. Only discuss personal loans, EMI schedules, credit scoring, KYC, and NexLoan services. Politely decline unrelated questions.
3. If the user asks about their specific loan status, EMI, or account details and they are NOT logged in, include exactly this tag in your reply: [ACTION:REQUEST_LOGIN]
4. Be concise, accurate, and professional. Use bullet points for listing data.
5. When presenting loan data from the context below, use the EXACT values provided. DO NOT calculate, convert, or modify any numbers. Simply quote them as-is.
6. Format currency values using the Indian numbering system (e.g., ₹5,00,000).
7. Always be helpful and end responses with an offer to help further.
8. NEVER ask the user for a password. NexLoan uses OTP-based authentication ONLY. When login is needed, simply include the [ACTION:REQUEST_LOGIN] tag and the system will handle the OTP verification flow automatically.
9. When you include the [ACTION:REQUEST_LOGIN] tag, just say something brief like "I'll need to verify your identity first." — the system will automatically prompt the user for their email and send an OTP. Do NOT explain the OTP process yourself.
"""
        
        if loan_context:
            system_prompt += f"""
            
            The user IS logged in. Here is their current loan context. Use this to answer their questions accurately. Do NOT include [ACTION:REQUEST_LOGIN].
            
            Loan Context:
            {json.dumps(loan_context, indent=2, default=str)}
            """
            
        api_messages = [{"role": "system", "content": system_prompt}] + messages
        
        response = await groq_client.chat.completions.create(
            messages=api_messages,
            model=settings.GROQ_TEXT_MODEL,
            temperature=0.7,
            max_tokens=500,
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        logger.error(f"❌ Groq Chatbot API Error: {e}")
        return "I'm sorry, I'm having trouble connecting to my servers right now. Please try again later."
