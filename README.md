# AulaSense — Voz Segura

Plataforma web educativa para el seguimiento pedagógico de estudiantes, el análisis de respuestas en aula y la generación de recomendaciones automáticas con inteligencia artificial.

Pensada para el contexto educativo peruano, toma como referencia el enfoque de Tutoría y Orientación Educativa del **MINEDU**.

> **Demo en vivo:** https://proyecto-hackathon-mu.vercel.app

---

## Funcionalidades

- **Panel docente** con inicio de sesión y dashboard por aula.
- **Encuesta anónima** para estudiantes (7 dimensiones de bienestar: emoción, motivación, atención, energía, ambiente, acompañamiento, tema de interés).
- **Visualizaciones** con Chart.js: barras, dona, radar, líneas y pies, con porcentajes integrados.
- **Indicadores clave (KPIs)** en tiempo real: alegría, estrés/ansiedad, motivación alta, energía alta, tristeza y ambiente tenso.
- **Recomendaciones IA** generadas con OpenAI, alineadas al Manual MINEDU (áreas, unidades, pasos, materiales y duración estimada).
- **Persistencia serverless** con Neon Postgres — los datos sobreviven a cold starts y deploys.
- **Diseño accesible** con sistema de tokens compartido, navegación por teclado, focus visible y ARIA roles.

## Tech stack

| Capa | Tecnología |
|---|---|
| Frontend | HTML + CSS + JavaScript vanilla (sin framework) |
| Charts | Chart.js + chartjs-plugin-datalabels |
| Backend | Node.js 20 + Express 5 |
| Base de datos | Neon Postgres serverless (`@neondatabase/serverless`) |
| IA | OpenAI Chat Completions (`gpt-4o-mini` por defecto, JSON mode) |
| Hosting | Vercel (auto-deploy desde GitHub) |

## Estructura

```text
api/
  index.js              # Entrada serverless para Vercel (envuelve Express)
public/
  index.html
  index.css             # Landing
  favicon.svg
  styles/
    tokens.css          # Sistema de design tokens compartido
    base.css            # Reset, tipografía, utilidades, focus accesible
  teacher/              # Panel del docente
    teacher.html
    teacher.css
    teacher.js
  student/              # Encuesta del estudiante
    student.html
    student.css
    student.js
scripts/
  init-db.js            # Crea tablas y siembra aulas + profesores demo
src/
  app.js                # Aplicación Express (rutas + lógica IA)
server.js               # Entrada para desarrollo local
vercel.json             # Rewrites: /api/* → api/index.js
.env.example            # Plantilla de variables de entorno
```

## Variables de entorno

```bash
DATABASE_URL=         # Connection string de Neon (inyectada por Vercel automáticamente)
OPENAI_API_KEY=       # Opcional. Si está vacía, la IA muestra "IA desactivada".
OPENAI_MODEL=gpt-4o-mini
```

## Instalación local

1. **Clona e instala dependencias:**
   ```bash
   git clone https://github.com/SebastianLevano/proyecto_hackathon.git
   cd proyecto_hackathon
   npm install
   cp .env.example .env
   ```

2. **Crea una base Postgres serverless** (cualquiera de las dos):
   - **Opción A (recomendada):** importa el repo en Vercel, ve a *Storage → Create → Neon Postgres*. Vercel conecta la DB al proyecto y expone el connection string.
   - **Opción B:** crea una cuenta gratuita en [neon.tech](https://neon.tech), crea un proyecto y copia el `DATABASE_URL`.

3. **Configura `.env`** con tu `DATABASE_URL` y opcionalmente `OPENAI_API_KEY`.

4. **Inicializa schema y datos demo** (idempotente):
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
2. En Vercel: **Add New → Project → Import** el repositorio.
3. **Storage → Create → Neon Postgres** y conéctalo al proyecto. Vercel inyecta `DATABASE_URL` automáticamente.
4. **Settings → Environment Variables:** agrega `OPENAI_API_KEY` (y `OPENAI_MODEL` si quieres otro modelo).
5. Inicializa la DB una sola vez desde tu máquina (apunta al mismo Neon):
   ```bash
   vercel env pull .env.local
   node scripts/init-db.js
   ```
6. **Redeploy** desde Vercel para que tome los env vars y la DB lista.

Cada `git push origin main` dispara un deploy automático.

## Credenciales demo

```text
profesor1 / pass1   →  1ro de Secundaria
profesor2 / pass2   →  2do de Secundaria
profesor3 / pass3   →  3ro de Secundaria
profesor4 / pass4   →  4to de Secundaria
profesor5 / pass5   →  5to de Secundaria
```

> ⚠️ Las contraseñas están en texto plano: aceptable para hackathon/demo, **no** para producción.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/login` | Autentica al docente (`username`, `password`) |
| `GET`  | `/api/aulas` | Lista las aulas disponibles |
| `POST` | `/api/respuestas` | Registra una respuesta anónima del estudiante |
| `GET`  | `/api/respuestas/:aulaId` | Lista respuestas de un aula |
| `POST` | `/api/ia/recomendaciones` | Genera estadísticas + recomendaciones IA |

## Autor

**Sebastián Lévano** — Hackathon educativo 2026.
