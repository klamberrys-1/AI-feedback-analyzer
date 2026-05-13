from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()

# Esto es CRUCIAL: Permite que tu React (que corre en otro puerto) pueda hablar con Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción pondrías la URL de tu web
    allow_methods=["*"],
    allow_headers=["*"],
)

# Definimos qué datos esperamos recibir
class ComentariosInput(BaseModel):
    textos: List[str]

@app.get("/")
def home():
    return {"mensaje": "API de Análisis de Feedback Activa"}

@app.post("/analizar")
async def analizar(data: ComentariosInput):
    # Por ahora, solo devolvemos lo que recibimos para probar la conexión
    return {"recibido": data.textos, "estado": "Listo para conectar con Gemini"}