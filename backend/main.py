import os
import json
import google.generativeai as genai
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv

# 1. Configuración de IA
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel('models/gemini-2.5-flash')
#model = genai.GenerativeModel('gemini-1.5-flash')
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(f"Modelo disponible: {m.name}")
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ComentariosInput(BaseModel):
    textos: List[str]

@app.get("/")
def home():
    return {"status": "online", "model": "gemini-1.5-flash"}

@app.post("/analizar")
async def analizar_feedback(data: ComentariosInput):
    # Prompt de Ingeniería: Pedimos un JSON puro para que sea fácil de procesar
    prompt = f"""
    Actúa como un experto analista de experiencia de cliente (CX). 
    Analiza la siguiente lista de comentarios y clasifícalos.
    
    Devuelve la respuesta ÚNICAMENTE como un arreglo de objetos JSON (sin texto extra, sin markdown ```json ).
    Formato esperado por cada objeto:
    {{
        "texto": "comentario original",
        "sentimiento": "Positivo | Negativo | Neutro",
        "categoria": "App | Servicio | Precio | Calidad",
        "urgencia": 1 a 5,
        "resumen": "una frase muy corta"
    }}

    Lista de comentarios:
    {data.textos}
    """
    
    response = model.generate_content(prompt)
    
    # Limpieza de seguridad por si la IA incluye etiquetas de markdown
    raw_text = response.text.replace("```json", "").replace("```", "").strip()
    
    try:
        # Convertimos el texto de la IA en una lista real de Python
        analisis_final = json.loads(raw_text)
        return {"resultado": analisis_final}
    except Exception as e:
        return {"error": "Error al procesar la respuesta de la IA", "detalle": str(e), "raw": raw_text}