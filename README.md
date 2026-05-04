# 🎓 AulaSense – Plataforma Educativa Inteligente con IA

AulaSense es una plataforma web educativa diseñada para el seguimiento pedagógico de estudiantes, análisis de respuestas en aula y generación de recomendaciones automáticas mediante inteligencia artificial.

El sistema está enfocado en el contexto educativo peruano, alineado con el enfoque de Tutoría y Orientación Educativa del MINEDU.

🔗 Demo en vivo: https://proyecto-hackathon-m8pe.onrender.com/

---

## 🚀 Funcionalidades principales

### 👨‍🏫 Panel Docente
- Inicio de sesión por usuario
- Dashboard de aula personalizado
- Visualización de respuestas de estudiantes
- Análisis automático de datos del aula
- Limpieza y reinicio de sesión
- Interfaz tipo panel educativo moderno

### 🤖 Inteligencia Artificial
- Análisis automático de respuestas del aula
- Generación de recomendaciones pedagógicas
- Enfoque basado en el Manual de Tutoría del MINEDU
- Uso de OpenAI GPT-4o-mini
- Detección de patrones en emociones, motivación, atención y clima del aula

### 📊 Visualización de datos
- Gráficos interactivos con Chart.js
- Estadísticas por aula
- Indicadores de aprendizaje y bienestar
- Panel dinámico en tiempo real

### 🗄️ Base de datos
- SQLite (better-sqlite3)
- Gestión de docentes, aulas y respuestas
- Almacenamiento local eficiente para prototipo educativo

---

## 🧱 Tecnologías utilizadas

Node.js · Express.js · SQLite (better-sqlite3) · JavaScript (Vanilla) · HTML5 · CSS3 · Chart.js · OpenAI API · Render

---

## 📁 Estructura del proyecto

public/
├── index/
│   ├── index.html
│   ├── index.css
├── docente/
│   ├── docente.html
│   ├── docente.css
│   ├── docente.js
├── estudiante/
│   ├── estudiante.html
│   ├── estudiante.css
│   ├── estudiante.js
server.js
aulasense.db

---

## ⚙️ Instalación local

1. Clonar el repositorio:
git clone https://github.com/SebastianLevano/proyecto_hackathon.git

2. Entrar al proyecto:
cd proyecto_hackathon

3. Instalar dependencias:
npm install

4. Crear archivo .env:
OPENAI_API_KEY=tu_api_key

5. Ejecutar servidor:
node server.js

6. Abrir en navegador:
http://localhost:3000

---

## 🌐 Deploy en producción

https://proyecto-hackathon-m8pe.onrender.com/

---

## 🧠 Objetivo del proyecto

AulaSense busca mejorar el análisis educativo en el aula mediante:
- Uso de inteligencia artificial aplicada a educación
- Detección de emociones y motivación del estudiante
- Apoyo al docente en la toma de decisiones pedagógicas
- Digitalización del seguimiento de aula

---

## 📌 Futuras mejoras

- Autenticación con JWT
- Migración a PostgreSQL
- Panel de estudiantes
- Notificaciones en tiempo real
- Exportación de reportes en PDF
- Mejora UI/UX tipo SaaS educativo

---

## 👨‍💻 Autor

Sebastián Lévano
Proyecto desarrollado como sistema educativo inteligente para evento Hackaton

---

## 📄 Licencia
Este proyecto es de uso educativo y académico.