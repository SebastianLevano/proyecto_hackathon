# AulaSense — Voz Segura

AulaSense es una plataforma web educativa para el seguimiento pedagógico de estudiantes, el análisis de respuestas en aula y la generación de recomendaciones automáticas con inteligencia artificial.

El sistema está pensado para el contexto educativo peruano y toma como referencia el enfoque de Tutoría y Orientación Educativa del MINEDU.

## Funcionalidades

- Panel docente con inicio de sesión y dashboard por aula.
- Encuesta anónima para estudiantes (7 dimensiones de bienestar).
- Estadísticas de emociones, motivación, atención, energía, ambiente, acompañamiento y temas de interés.
- Recomendaciones pedagógicas generadas con OpenAI alineadas al manual MINEDU.
- Frontend con HTML, CSS y JavaScript vanilla (sistema de tokens compartido).
- Backend Node.js + Express con base de datos serverless (Neon Postgres).

## Estructura

```text
api/
  index.js              # Entrada serverless para Vercel
public/
  index.html
  index.css
  favicon.svg
  styles/
    tokens.css          # Sistema de design tokens compartido
    base.css            # Reset, tipografía e utilidades
  teacher/
    teacher.html
    teacher.css
    teacher.js
  student/
    student.html
    student.css
    student.js
scripts/
  init-db.js            # Crea tablas y siembra aulas + profesores demo
src/
  app.js                # Aplicación Express
server.js               # Entrada local
vercel.json             # Rewrites para API en Vercel
```

## Variables de entorno

```bash
DATABASE_URL=        # Connection string de Neon / Vercel Postgres
OPENAI_API_KEY=      # Opcional. Si está vacía, la IA queda desactivada.
OPENAI_MODEL=gpt-4o-mini
```

## Instalación local

1. **Clona el repo e instala dependencias:**
   ```bash
   npm install
   cp .env.example .env
   ```

2. **Crea una base Postgres serverless:**
   - Opción A (recomendada): crear un proyecto en Vercel, ir a *Storage → Create → Neon* y conectarlo.
   - Opción B: crear una cuenta en [neon.tech](https://neon.tech) y copiar el `DATABASE_URL`.

3. **Configura `.env`** con `DATABASE_URL` y opcionalmente `OPENAI_API_KEY`.

4. **Inicializa el schema y los datos demo:**
   ```bash
   node scripts/init-db.js
   ```

5. **Arranca el servidor:**
   ```bash
   npm run dev
   ```

   Abre `http://localhost:3000`.

## Deploy a Vercel

1. Sube el repo a GitHub: `git push origin main`.
2. En el dashboard de Vercel: **Add New → Project → Import** el repositorio.
3. **Storage → Create → Neon Postgres** y conéctalo al proyecto. Vercel inyecta `DATABASE_URL` automáticamente.
4. **Settings → Environment Variables**: agrega `OPENAI_API_KEY` (y opcionalmente `OPENAI_MODEL`).
5. Inicializa la DB una sola vez desde tu máquina:
   ```bash
   vercel env pull .env.local
   node scripts/init-db.js
   ```
6. Redeploy desde Vercel y abre la URL pública.

## Credenciales demo

```text
profesor1 / pass1
profesor2 / pass2
profesor3 / pass3
profesor4 / pass4
profesor5 / pass5
```

Cada usuario está asignado a un aula distinta (1ro a 5to de Secundaria). Las contraseñas están en texto plano: aceptable para hackathon, no para producción.

## Autor

Sebastián Lévano
