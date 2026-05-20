import os
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv

# Usaremos el cliente Groq en lugar de google.generativeai
from groq import Groq

load_dotenv()
groq_key = os.getenv("GROQ_APY_KEY")
if not groq_key:
    raise RuntimeError("La variable de entorno GROQ_APY_KEY no está definida. Por favor configura tu clave de API de Groq en .env.")

client = Groq(api_key=groq_key)

app = FastAPI()

# Ajusta orígenes a tu frontend para más seguridad
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://portafolio-6eb68.firebaseapp.com", "https://portafolio-6eb68.web.app"
    ],
    allow_methods=["*"],


    allow_headers=["*"],
)


class ComentariosInput(BaseModel):
    textos: List[str]


@app.get("/")
def home():
    return {"status": "online", "model": "llama-3.3-70b-versatile", "provider": "groq"}


@app.post("/analizar")
async def analizar_feedback(data: ComentariosInput):
    # Prompt: pedimos JSON puro para facilidad de parsing
    prompt = f"""
Actúa como un experto analista de experiencia de cliente (CX).
Analiza la siguiente lista de comentarios y para cada comentario devuelve un objeto JSON con las claves:
- texto: el comentario original
- sentimiento: Positivo | Negativo | Neutro
- categoria: App | Servicio | Precio | Calidad | Otro
- urgencia: entero del 1 al 5
- respuesta_sugerida: Una respuesta empática y profesional para el cliente

DEVUELVE ÚNICAMENTE un arreglo JSON válido (sin texto adicional, sin markdown, sin explicaciones).

    Ejemplo esperado:
[
  {{"texto":"...","sentimiento":"Positivo","categoria":"App","urgencia":3,"respuesta_sugerida":"..."}},
  ...
]

Comentarios:
{data.textos}
"""

    # Intentamos el modelo más reciente y estable; si no está disponible usamos un fallback
    model_primary = "llama-3.3-70b-versatile"
    model_fallback = "llama-3.1-70b-versatile"
    response = None
    try:
        response = client.chat.completions.create(
            model=model_primary,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )
        used_model = model_primary
    except Exception as e_primary:
        try:
            response = client.chat.completions.create(
                model=model_fallback,
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
            )
            used_model = model_fallback
        except Exception as e_fallback:
            return {"error": "Error llamando a Groq con ambos modelos", "detalle_primary": str(e_primary), "detalle_fallback": str(e_fallback)}

    # Extraer texto crudo de la respuesta del SDK (adaptable según SDK)
    raw = None
    # Según la instrucción, extraemos: response.choices[0].message.content
    content = None
    try:
        # Intentamos la estructura esperada
        content = response.choices[0].message.content
    except Exception:
        # Fallbacks según lo que devuelva el SDK
        if isinstance(response, str):
            content = response
        elif hasattr(response, 'text'):
            content = response.text
        elif isinstance(response, dict):
            # Busca estructuras comunes
            try:
                content = response['choices'][0]['message']['content']
            except Exception:
                content = json.dumps(response)
        else:
            content = str(response)

    try:
        analisis_final = json.loads(content)
        return {"resultado": analisis_final}
    except Exception as e:
        return {"error": "Error al procesar la respuesta de Groq", "detalle": str(e), "raw": content}