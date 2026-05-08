# AulaSense

AulaSense es una plataforma web educativa para el seguimiento pedagógico de estudiantes, el análisis de respuestas en aula y la generación de recomendaciones automáticas con inteligencia artificial.

El sistema está pensado para el contexto educativo peruano y toma como referencia el enfoque de Tutoría y Orientación Educativa del MINEDU.

## Funcionalidades

- Panel docente con inicio de sesión y dashboard por aula.
- Encuesta anónima para estudiantes.
- Registro de respuestas por aula.
- Estadísticas de emociones, motivación, atención, energía, ambiente y acompañamiento.
- Recomendaciones pedagógicas generadas con OpenAI.
- Frontend estático con HTML, CSS y JavaScript vanilla.
- Backend Node.js con Express y SQLite.

## Estructura

```text
api/
  index.js              # Entrada serverless para Vercel
public/
  index.html
  index.css
  favicon.svg
  teacher/
    teacher.html
    teacher.css
    teacher.js
  student/
    student.html
    student.css
    student.js
src/
  app.js                # Aplicación Express
server.js               # Entrada local
aulasense.db            # Base SQLite de prototipo
vercel.json             # Rewrites para API en Vercel
```

## Instalación local

```bash
npm install
cp .env.example .env
npm run dev
```

Luego abre:

```text
http://localhost:3000
```

Variables de entorno:

```bash
OPENAI_API_KEY=tu_api_key
OPENAI_MODEL=gpt-4o-mini
```

## Credenciales demo

```text
profesor1 / pass1
profesor2 / pass2
profesor3 / pass3
profesor4 / pass4
profesor5 / pass5
```

## Autor

Sebastián Lévano
