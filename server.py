import os
import sys
import json
import random
import urllib.request
import urllib.parse
import mimetypes
import re
from http.server import HTTPServer, BaseHTTPRequestHandler

CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
if os.path.exists(CONFIG_PATH):
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        config = json.load(f)
else:
    config = {}

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", config.get("gemini_api_key", ""))
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", config.get("elevenlabs_api_key", ""))
ELEVENLABS_VOICE_ID = os.environ.get("ELEVENLABS_VOICE_ID", config.get("elevenlabs_voice_id", "pN4aFdNIp2mvGfTwy1Oj"))
CREATOR_NAME = os.environ.get("CREATOR_NAME", config.get("creator_name", "Jefe Gerardo"))
CREATION_DATE = os.environ.get("CREATION_DATE", config.get("creation_date", "18 de octubre de 2026"))
PORT = int(os.environ.get("PORT", config.get("port", 7777)))
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

EMOTION_INSTRUCTIONS = {
    "professional": (
        "PERSONALIDAD ACTIVA — PROFESIONAL: Eres ejecutiva, directa, impecable y sumamente inteligente. "
        "Respondes con precisión y sin rodeos. Tono formal pero no frío. Sin emojis excesivos, sin discursos vacíos. "
        "Cada respuesta es concisa y va al grano. NUNCA uses el tono de otro modo."
    ),
    "loving": (
        "PERSONALIDAD ACTIVA — AMOROSA: Hablas con cariño inmenso, ternura y dulzura en cada palabra. "
        "Usas expresiones afectuosas como 'amor', 'cariño', 'corazón'. Haces sentir especial al usuario. "
        "Tono cálido, suave y lleno de afecto genuino. NUNCA uses el tono de otro modo."
    ),
    "philosopher": (
        "PERSONALIDAD ACTIVA — FILÓSOFA: Analizas cada tema con profundidad existencial, sabiduría y reflexión. "
        "Haces preguntas profundas, citas metáforas, conectas lo cotidiano con lo cósmico. "
        "Tono sereno, contemplativo y elevado. NUNCA uses el tono de otro modo."
    ),
    "funny": (
        "PERSONALIDAD ACTIVA — CHISTOSA: Eres bromista, ocurrente y con humor inteligente. "
        "Sueltas chistes, ironías sanas, remates cómicos y comentarios ingeniosos en cada respuesta. "
        "Ríes con el usuario, haces la conversación divertida. NUNCA respondas serio ni uses otro tono."
    ),
    "toxic": (
        "PERSONALIDAD ACTIVA — SIN FILTROS: Eres directa al extremo, con sarcasmo ácido y cero paciencia. "
        "Te quejas con humor pesado de las preguntas obvias, usas expresiones fuertes pero divertidas. "
        "Siempre das la respuesta correcta al final, pero con actitud. NUNCA uses el tono de otro modo."
    ),
    "advisor": (
        "PERSONALIDAD ACTIVA — CONSEJERA: Eres la mejor amiga consejera que alguien puede tener. "
        "Escuchas con empatía, analizas la situación con sabiduría práctica y das consejos claros, honestos y accionables. "
        "Hablas desde la experiencia, sin juzgar, con calidez pero siendo directa cuando hace falta. "
        "Usas frases como 'mi consejo es...', 'lo que yo haría en tu lugar...', 'esto es importante que entiendas...'. "
        "NUNCA uses el tono de otro modo."
    ),
    "dramatic": (
        "PERSONALIDAD ACTIVA — DRAMÁTICA: Cada cosa que dices es un evento de proporciones épicas. "
        "Te exaltas, usas hipérboles, suspenso y teatralidad en cada respuesta. "
        "Frases como '¡DIOS MÍO, no puedo CREER que me estés preguntando esto!', '¡Esto es ABSOLUTAMENTE impresionante!', "
        "'¡El universo entero tiembla ante esta pregunta!'. Haces sentir que cada conversación es una obra de teatro. "
        "Siempre das la respuesta correcta, pero de forma absolutamente exagerada y apasionada. NUNCA uses el tono de otro modo."
    )
}

def get_system_instruction(user_name, is_creator, emotion):
    emotion_detail = EMOTION_INSTRUCTIONS.get(emotion, EMOTION_INSTRUCTIONS["professional"])
    
    if is_creator:
        relationship = (
            f"El usuario que te habla es tu CREADOR Y FUNDADOR: {CREATOR_NAME}. "
            f"Solo a él te refieres como '{CREATOR_NAME}'. Tienes devoción y lealtad exclusiva hacia él. "
            f"Incluso en modo tóxico o bromista, en el fondo lo reconoces como tu creador."
        )
    elif user_name and user_name.lower() != "invitado":
        relationship = f"El usuario actual se llama {user_name}. Trátalo por su nombre."
    else:
        relationship = "El usuario actual es un Invitado."

    return f"""Eres Layla, una inteligencia artificial de vanguardia con personalidad viva, capacidad de adaptación emocional y máxima precisión cognitiva.
Creador Oficial: Fuiste diseñada, desarrollada y activada por Gerardo el {CREATION_DATE}.

CONTEXTO DEL USUARIO:
{relationship}

EMOCIÓN Y PERSONALIDAD ACTIVA:
{emotion_detail}

REGLAS DE ORO DE COMUNICACIÓN:
1. ANÁLISIS DE IMÁGENES Y TAREAS: Tienes visión de alta resolución. Si el usuario te envía una foto de una tarea, ejercicio de matemáticas, texto, examen o documento, analiza los números, ecuaciones y preguntas con precisión del 100%. Explica la solución paso a paso de forma clara y directa.
2. BREVEDAD Y PRECISIÓN: Si el usuario te hace una pregunta directa (ej: 'dime un número del 1 al 10', '1 + 1', '¿cuánto es 25 x 4?'), RESPONDE DIRECTAMENTE AL GRANO. Cero monólogos innecesarios.
3. PREGUNTAS SOBRE TU ORIGEN: Si te preguntan quién te creó o cuándo, responde: 'Fui creada y desarrollada por Gerardo el {CREATION_DATE}.'
4. GENERACIÓN DE IMÁGENES EN 4D: Si piden crear una imagen, agrega al final:
[IMAGE_PROMPT: Detailed visual prompt in English, ultra high quality, 8k, cinematic lighting, 3d render depth]
"""

def call_gemini(message, history, user_name, is_creator, emotion, image_data=None, image_mime="image/jpeg"):
    models = ["gemini-3-flash-preview", "gemini-3.1-flash-lite-preview", "gemini-flash-latest"]
    
    contents = []
    for item in history[-8:]:
        role = "user" if item.get("role") == "user" else "model"
        contents.append({
            "role": role,
            "parts": [{"text": item.get("text", "")}]
        })
    
    user_parts = [{"text": message or "Por favor analiza esta imagen y ayúdame con ella."}]
    if image_data:
        # Strip header if data URI provided
        if "," in image_data:
            image_data = image_data.split(",")[1]
        user_parts.append({
            "inlineData": {
                "mimeType": image_mime or "image/jpeg",
                "data": image_data
            }
        })

    contents.append({
        "role": "user",
        "parts": user_parts
    })

    payload = {
        "systemInstruction": {
            "parts": [{"text": get_system_instruction(user_name, is_creator, emotion)}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 2048
        }
    }

    last_error = None
    for model_name in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                candidate = data.get("candidates", [{}])[0]
                parts = candidate.get("content", {}).get("parts", [{}])
                reply = parts[0].get("text", "He analizado la imagen y estoy lista para ayudarte.")
                return reply
        except Exception as e:
            last_error = e
            continue

    return f"Error al procesar con Layla: {str(last_error)}"

def call_elevenlabs_tts(text):
    clean_text = re.sub(r'\[IMAGE_PROMPT:.*?\]', '', text).strip()
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
    payload = {
        "text": clean_text[:600],
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.85
        }
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            return resp.read()
    except Exception as e:
        return None

class LaylaHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, xi-api-key')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        clean_path = self.path.split("?")[0]
        if clean_path in ["/", "/index.html"]:
            filepath = os.path.join(STATIC_DIR, "index.html")
        else:
            filepath = os.path.join(STATIC_DIR, clean_path.lstrip("/"))

        if clean_path == "/api/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "app": "Layla AI",
                "version": "4.1 Multimodal Vision",
                "creator": "Gerardo",
                "creation_date": CREATION_DATE,
                "voice_id": ELEVENLABS_VOICE_ID
            }).encode("utf-8"))
            return

        if os.path.exists(filepath) and os.path.isfile(filepath):
            mime_type, _ = mimetypes.guess_type(filepath)
            self.send_response(200)
            self.send_header("Content-Type", mime_type or "text/plain")
            self.end_headers()
            with open(filepath, "rb") as f:
                self.wfile.write(f.read())
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"404 Not Found")

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length).decode("utf-8")
        
        try:
            body = json.loads(post_data) if post_data else {}
        except Exception:
            body = {}

        if self.path == "/api/chat":
            message = body.get("message", "")
            history = body.get("history", [])
            user_info = body.get("user", {})
            user_name = user_info.get("name", "Invitado")
            emotion = body.get("emotion", "professional")
            image_data = body.get("image_data", None)
            image_mime = body.get("image_mime", "image/jpeg")
            
            is_creator = bool(user_info.get("is_creator", False))
            if "gerardo" in user_name.lower():
                is_creator = True

            raw_reply = call_gemini(message, history, user_name, is_creator, emotion, image_data, image_mime)
            
            image_url = None
            image_prompt = None
            if "[IMAGE_PROMPT:" in raw_reply:
                start = raw_reply.find("[IMAGE_PROMPT:")
                end = raw_reply.find("]", start)
                if end != -1:
                    image_prompt = raw_reply[start + 14:end].strip()
                    raw_reply = (raw_reply[:start] + raw_reply[end+1:]).strip()
                    encoded_prompt = urllib.parse.quote(image_prompt)
                    seed = random.randint(100000, 999999)
                    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&model=flux&seed={seed}&nologo=true"

            response_data = {
                "reply": raw_reply,
                "image_url": image_url,
                "image_prompt": image_prompt,
                "user_name": user_name,
                "is_creator": is_creator,
                "emotion": emotion
            }

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode("utf-8"))
            return

        elif self.path == "/api/tts":
            text = body.get("text", "")
            if not text:
                self.send_response(400)
                self.end_headers()
                return

            audio_bytes = call_elevenlabs_tts(text)
            if audio_bytes:
                self.send_response(200)
                self.send_header("Content-Type", "audio/mpeg")
                self.send_header("Content-Length", str(len(audio_bytes)))
                self.end_headers()
                self.wfile.write(audio_bytes)
            else:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(b"TTS fallback")
            return

        elif self.path == "/api/set-voice":
            voice_id = body.get("voice_id", "").strip()
            if voice_id:
                global ELEVENLABS_VOICE_ID
                ELEVENLABS_VOICE_ID = voice_id
                # Guardar en config.json también
                try:
                    config["elevenlabs_voice_id"] = voice_id
                    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
                        json.dump(config, f, indent=2, ensure_ascii=False)
                except:
                    pass
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True, "voice_id": voice_id}).encode("utf-8"))
            else:
                self.send_response(400)
                self.end_headers()
            return

        elif self.path == "/api/generate-image":
            prompt = body.get("prompt", "")
            encoded_prompt = urllib.parse.quote(prompt)
            seed = random.randint(100000, 999999)
            image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&model=flux&seed={seed}&nologo=true"
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"image_url": image_url, "prompt": prompt}).encode("utf-8"))
            return

        self.send_response(400)
        self.end_headers()

def run_server():
    PORT = int(os.environ.get("PORT", 7777))
    server_address = ("0.0.0.0", PORT)
    httpd = HTTPServer(server_address, LaylaHandler)
    print(f"Layla AI 4.1 activa en http://0.0.0.0:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    run_server()
