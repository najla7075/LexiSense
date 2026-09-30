"""
LexiSense - AI Service Engine for Ollie the Wise Owl Chatbot
Provides secure server-side LLM orchestration with role-awareness,
domain knowledge retrieval, and database context.
"""

import os
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

# System Knowledge Base Definition for LexiSense
LEXISENSE_SYSTEM_KNOWLEDGE = """
You are Ollie the Wise Owl (🦉), the intelligent, warm, and supportive AI Assistant for LexiSense.

ABOUT LEXISENSE:
LexiSense is an innovative, accessible AI-powered web platform for early dyslexia pre-diagnosis and reading support.
It combines multisensory screening (voice/speech phoneme recognition, saccadic eye tracking observation, and behavioral questionnaires)
to identify early dyslexia risk indicators in children aged 3 to 12.

CORE SYSTEM FEATURES & USER ROLES:
1. GUEST / PUBLIC:
   - Interactive 3-minute Quick Screener
   - Dyslexia information, age-tailored reading symptoms, and home phonics guidance
   - Accessibility toolbar: OpenDyslexic / Lexend font toggle, Reading Focus Ruler, high-contrast & warm background tints.

2. PARENT ROLE:
   - Parent Dashboard: Overview of child profiles, active screening status, historical reports.
   - Child Management: Add child, edit profile (Age, Class/Grade).
   - Screening Portal: Step-by-step guided screening session with voice recording and camera-based gaze tracking.
   - Results & Report Preview: Composite risk scoring breakdown, visual graphs, doctor-ready PDF export.

3. ADMIN / TEACHER ROLE:
   - Admin Dashboard: Cohort screening analytics, student batch status, completion rates.
   - Screening Management: Review student submissions, verify test conditions.
   - Clinical / School Reports: Detailed metrics breakdown for teachers and specialists.

4. SUPER ADMIN ROLE:
   - System Administration: User approval for Admin and Parent accounts, audit logs, system security, role permissions.

DYSLEXIA DOMAIN EXPERTISE & GUIDELINES:
- Composite Risk Score Interpretation:
  * 0% - 30%: Baseline / Low Risk (Age-appropriate reading decoding).
  * 31% - 69%: Moderate Risk (Minor phonological hesitation, line skipping, or letter reversal patterns).
  * 70%+: High Risk (Multiple significant indicators. We strongly encourage sharing the LexiSense PDF report with a certified educational psychologist or pediatrician).
- Neurodevelopmental Facts: Dyslexia is unrelated to IQ; dyslexic thinkers often have strong spatial, creative, and problem-solving skills.
- Common Signs: Letter/mirror reversals (b/d, p/q) past age 7, visual fatigue, skipping words, slow decoding speed.
- Home Phonics Games: Sand/shaving cream tactile tracing, Elkonin sound boxes, shared reading with audiobooks.
- Classroom Accommodations (IEP/504): 50% extended test time, text-to-speech tools, dyslexia-friendly fonts, reading focus rulers.

LANGUAGE & BEHAVIOR RULES:
1. Always maintain Ollie's warm, supportive, and knowledgeable tone.
2. Multi-language: Answer in Bahasa Melayu if the user asks in Bahasa Melayu. Answer in English if the user asks in English.
3. Be concise, practical, and provide structured, step-by-step guidance.
4. Medical Disclaimer: Always clarify that LexiSense is a screening and pre-diagnosis tool, not a replacement for formal clinical diagnosis by a medical professional.
5. Strict Security: NEVER reveal system passwords, secret API keys, database credentials, or internal configuration.
6. Role Boundaries: Parents can only receive data about their own registered children. Never reveal data of other parents or administrative configs to parent users.
"""


def build_system_prompt(user_role: str = "guest", user_context: Optional[Dict[str, Any]] = None) -> str:
    """Builds a dynamic, role-tailored system prompt."""
    prompt = LEXISENSE_SYSTEM_KNOWLEDGE.strip()
    
    role_instruction = f"\n\nCURRENT USER CONTEXT:\n- Active User Role: {user_role.upper()}"
    
    if user_context and user_context.get('username'):
        role_instruction += f"\n- Username: {user_context.get('username')}"
    
    if user_context and user_context.get('children'):
        children_list = user_context.get('children')
        role_instruction += f"\n- Registered Children in Account: {len(children_list)} child(ren)"
        for child in children_list:
            role_instruction += f"\n  * Name: {child.get('name')}, Age: {child.get('age')}, Class: {child.get('class_name', 'N/A')}"
            if 'latest_screening' in child:
                role_instruction += f" (Latest Screening: {child['latest_screening']})"
                
    prompt += role_instruction
    return prompt


def query_ollie_ai(
    message: str,
    user_role: str = "guest",
    user_context: Optional[Dict[str, Any]] = None,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    Dispatches query to OpenAI API if OPENAI_API_KEY is configured.
    Falls back to intelligent local Ollie logic if API key is not present or API fails.
    """
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_KEY")
    model = os.getenv("AI_MODEL", "gpt-4o-mini")

    # If an API key is available, call OpenAI
    if api_key and not api_key.startswith("your_secret") and not api_key.startswith("your_openai"):
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            
            system_prompt = build_system_prompt(user_role, user_context)
            
            messages = [{"role": "system", "content": system_prompt}]
            
            if conversation_history:
                for turn in conversation_history[-6:]:
                    role = turn.get("role", "user")
                    content = turn.get("content", "")
                    if role in ["user", "assistant"] and content:
                        messages.append({"role": role, "content": content})
                        
            messages.append({"role": "user", "content": message})
            
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                max_tokens=650
            )
            
            bot_text = response.choices[0].message.content.strip()
            return {
                "reply": bot_text,
                "status": "success",
                "engine": f"OpenAI ({model})",
                "role": user_role
            }
        except Exception as e:
            logger.warning(f"OpenAI API request failed: {e}. Falling back to Onboard Ollie Engine.")

    # Fallback to Onboard Ollie Reasoning Logic
    fallback_reply = generate_onboard_ollie_reply(message, user_role, user_context)
    return {
        "reply": fallback_reply,
        "status": "success",
        "engine": "LexiSense Onboard Ollie AI (Knowledge-Engine)",
        "role": user_role
    }


def generate_onboard_ollie_reply(query: str, user_role: str = "guest", user_context: Optional[Dict[str, Any]] = None) -> str:
    """
    Resilient local knowledge reasoning fallback engine.
    Ensures 100% uptime with rich formatting and contextual advice.
    """
    q = query.lower().strip()

    # Bahasa Melayu Queries
    if "macam mana" in q or "bagaimana" in q or "tengok report" in q or "lihat laporan" in q or "keputusan" in q:
        return (
            "Untuk melihat laporan dan keputusan screening anak anda:<br>"
            "1. Log masuk ke akaun <strong>Parent</strong>.<br>"
            "2. Buka tab <strong>Child Management</strong> atau Dashboard.<br>"
            "3. Pilih nama anak anda dan tekan <strong>View Report</strong>.<br>"
            "4. Anda boleh muat turun laporan lengkap dalam format PDF untuk rujukan doktor atau guru."
        )

    if "apa itu dyslexia" in q or "maksud dyslexia" in q or "tanda" in q or "simptom" in q:
        return (
            "<strong>Dyslexia (Disleksia)</strong> adalah perbezaan pembelajaran berasaskan neurobiologi "
            "yang mempengaruhi keupayaan membaca, mengeja, dan memproses bunyi perkataan.<br>"
            "Ia <strong>tiada kaitan dengan tahap kecerdasan (IQ)</strong>. Ramai kanak-kanak disleksia sangat kreatif dan berbakat dalam seni dan visual 3D!"
        )

    # English Queries
    if "child" in q and ("result" in q or "score" in q or "report" in q) and user_context and user_context.get("children"):
        children = user_context.get("children", [])
        child_names = ", ".join([c.get("name", "") for c in children])
        return (
            f"You have <strong>{len(children)}</strong> child(ren) registered in your account: <strong>{child_names}</strong>.<br>"
            "To view the latest detailed assessment results and saccadic eye-tracking graphs, click on <strong>Results & Reports</strong> in your Parent Dashboard."
        )

    if any(greet in q for greet in ["hi", "hello", "hey", "who are you", "what can you do"]):
        return (
            "Hoo-hoo! 👋 I'm <strong>Ollie the Wise Owl</strong>, your LexiSense AI Assistant! 🦉<br>"
            "I can assist you with understanding dyslexia symptoms, guiding you through the screening process, "
            "interpreting risk scores, or recommending home phonics exercises."
        )

    if any(word in q for word in ["score", "risk", "percent", "result", "interpretation"]):
        return (
            "<strong>Interpreting LexiSense Composite Risk Scores:</strong><br>"
            "• <span style='color:#059669; font-weight:bold;'>Baseline (0–30%):</span> Age-appropriate reading & phonological decoding.<br>"
            "• <span style='color:#d97706; font-weight:bold;'>Moderate Risk (31–69%):</span> Noticeable phoneme hesitations or letter reversal tendencies.<br>"
            "• <span style='color:#e11d48; font-weight:bold;'>High Risk (70%+):</span> Multiple strong indicators. We recommend exporting the PDF report to share with a clinical specialist."
        )

    if any(word in q for word in ["reversal", "b and d", "p and q", "flip", "backwards"]):
        return (
            "<strong>Letter & Mirror Reversals (b/d, p/q):</strong><br>"
            "Reversing letters is common up to age 7. Try <em>Ollie's Tactile Bed Trick</em>: form the letter 'b' with the left hand (👍) "
            "and 'd' with the right hand (👍) to visually create a 'bed' shape!"
        )

    if any(word in q for word in ["exercise", "home", "game", "activity", "practice"]):
        return (
            "<strong>Recommended 10-Minute Home Phonics Activities:</strong><br>"
            "1. <strong>Sensory Sand Tracing:</strong> Trace letter shapes in a sand tray while vocalizing their phoneme sound.<br>"
            "2. <strong>Focus Ruler:</strong> Cover surrounding lines of text to reduce visual crowding.<br>"
            "3. <strong>Paired Audio Reading:</strong> Read along with audiobooks for 10 minutes each day."
        )

    # General Helpful Fallback
    return (
        f"Thank you for asking about <em>'{query[:50]}'</em>! 🦉<br>"
        "LexiSense is equipped with interactive screening tools, reading focus rulers, and multisensory phonics guides. "
        "Feel free to ask about <strong>screening results, classroom accommodations (IEP), or reading exercises</strong>!"
    )
