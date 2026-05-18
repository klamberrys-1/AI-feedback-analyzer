Dashboard de Análisis Semántico con IA (Llama 3 + Groq)
Este proyecto es una solución Full-Stack diseñada para la automatización del análisis de feedback de clientes en tiempo real. Utiliza modelos de lenguaje de gran escala (LLM) para categorizar, medir la urgencia y generar respuestas sugeridas con una latencia ultra baja.

 Características Principales
Análisis Multidimensional: Clasifica el sentimiento (Positivo/Negativo/Neutro), detecta categorías (App, Precio, Servicio) y asigna niveles de urgencia del 1 al 5.

Inferencia de Alta Velocidad: Implementación de Groq con modelos Llama 3, aprovechando la tecnología LPU (Language Processing Unit) para respuestas casi instantáneas.

Visualización Dinámica: Dashboards interactivos construidos con Recharts para monitorear tendencias de CX (Customer Experience).

Arquitectura Escalable: Backend asíncrono con FastAPI y Frontend moderno con React + Tailwind v4.

 Stack Tecnológico
Frontend: React, TypeScript, Tailwind CSS v4, Recharts.

Backend: Python, FastAPI, Uvicorn, Pydantic.

IA: Groq SDK, Llama 3 (Inferencia en hardware especializado).

DevOps: Git, Variables de Entorno (.env), próximamente Docker.

Instalación y Configuración
Requisitos Previos
Python 3.10+

Node.js 18+

Una API Key de Groq Console.

Pasos
Clonar el repositorio:

Bash
git clone https://github.com/tu-usuario/Proyecto_1.git
cd Proyecto_1
Configurar el Backend:

Bash
cd backend
pip install -r requirements.txt
# Crear un archivo .env con tu llave:
# GROQ_APY_KEY=tu_llave_aqui
uvicorn main:app --reload
Configurar el Frontend:

Bash
cd ../frontend
npm install
npm run dev
 Ingeniería de Prompts (Logic)
El sistema utiliza un System Prompt especializado que actúa como un experto en CX, transformando texto no estructurado en datos estructurados (JSON) bajo restricciones determinísticas, lo que facilita la automatización de procesos de soporte.