// -------------------------------------------------
// AULASENSE — BACKEND COMPLETO CON IA HÍBRIDA
// -------------------------------------------------



const express = require("express");
const cors = require("cors");
const sqlite = require("better-sqlite3");
const path = require("path");
const OpenAI = require("openai");
require("dotenv").config();
console.log("API_KEY:", process.env.OPENAI_API_KEY ? "OK" : "NO");
console.log("Valor leído:", process.env.OPENAI_API_KEY ? "[oculto]" : process.env.OPENAI_API_KEY);

// Inicializar app ANTES de usarla
const app = express();
app.use(cors());
app.use(express.json());

// Carpeta pública correcta (solo esta)
app.use(express.static(path.join(__dirname, "public")));

// ----------------------------------------------------
// DATABASE
// ----------------------------------------------------
const db = new sqlite(path.join(__dirname, "aulasense.db"));

db.exec(`
CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    aula_id INTEGER
);

CREATE TABLE IF NOT EXISTS aulas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT
);

CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aula_id INTEGER,
    data TEXT,
    created_at TEXT
);
`);

// ----------------------------------------------------
// SEED
// ----------------------------------------------------
if (db.prepare("SELECT COUNT(*) AS c FROM aulas").get().c === 0) {
    ["1ro de Secundaria", "2do de Secundaria", "3ro de Secundaria", "4to de Secundaria", "5to de Secundaria"]
        .forEach(n => db.prepare("INSERT INTO aulas (nombre) VALUES (?)").run(n));
}

if (db.prepare("SELECT COUNT(*) AS c FROM teachers").get().c === 0) {
    for (let i = 1; i <= 5; i++) {
        db.prepare(`
            INSERT INTO teachers (username, password, aula_id)
            VALUES (?, ?, ?)
        `).run(`profesor${i}`, `pass${i}`, i);
    }
}

// ----------------------------------------------------
// SAFE JSON PARSE
// ----------------------------------------------------
function safeParse(text) {
    try { return JSON.parse(text); }
    catch { return null; }
}

// ----------------------------------------------------
// LOGIN
// ----------------------------------------------------
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    const t = db.prepare(`
        SELECT id, username, aula_id
        FROM teachers
        WHERE username = ? AND password = ?
    `).get(username, password);

    if (!t) return res.status(401).json({ error: "Credenciales incorrectas" });

    return res.json({
        id: t.id,
        username: t.username,
        aulaId: t.aula_id
    });
});

// ----------------------------------------------------
// LISTAR AULAS
// ----------------------------------------------------
app.get("/api/aulas", (req, res) => {
    res.json(db.prepare("SELECT * FROM aulas").all());
});

// ----------------------------------------------------
// GUARDAR RESPUESTAS
// ----------------------------------------------------
app.post("/api/respuestas", (req, res) => {
    const { aulaId, data } = req.body;
    if (!aulaId || !data)
        return res.status(400).json({ error: "Falta aulaId o data" });

    db.prepare(`
        INSERT INTO responses (aula_id, data, created_at)
        VALUES (?, ?, datetime('now'))
    `).run(aulaId, JSON.stringify(data));

    return res.json({ ok: true });
});

// ----------------------------------------------------
// LISTAR RESPUESTAS POR AULA
// ----------------------------------------------------
app.get("/api/respuestas/:aulaId", (req, res) => {
    const aulaId = req.params.aulaId;

    const rows = db.prepare(`
        SELECT id, aula_id, data, created_at
        FROM responses
        WHERE aula_id = ?
        ORDER BY created_at DESC
    `).all(aulaId);

    const parsed = rows.map(r => ({
        id: r.id,
        aula_id: r.aula_id,
        created_at: r.created_at,
        data: safeParse(r.data)
    }));

    return res.json(parsed);
});

// ----------------------------------------------------
// LISTAR TODAS LAS RESPUESTAS
// ----------------------------------------------------
app.get("/api/respuestas", (req, res) => {
    const rows = db.prepare(`
        SELECT id, aula_id, data, created_at
        FROM responses
        ORDER BY created_at DESC
    `).all();

    const parsed = rows.map(r => ({
        id: r.id,
        aula_id: r.aula_id,
        created_at: r.created_at,
        data: safeParse(r.data)
    }));

    return res.json(parsed);
});

// ----------------------------------------------------
// DETECCIÓN DE PATRONES
// ----------------------------------------------------
function extractStats(rows) {
    const stats = {
        total: rows.length,
        emocion: {},
        motivacion: {},
        atencion: {},
        energia: {},
        ambiente: {},
        acompanamiento: {},
        tema: {}
    };

    rows.forEach(r => {
        let answers = null;

        if (Array.isArray(r.answers)) {
            answers = r.answers;
        } else if (Array.isArray(r.data?.answers)) {
            answers = r.data.answers;
        } else if (r.data && typeof r.data === "object") {
            answers = Object.entries(r.data).map(([k, v]) => ({ qid: k, value: String(v) }));
        }

        if (!answers) return;

        answers.forEach(a => {
            const q = (a.qid || "").toLowerCase();
            const v = (a.value || "").trim();

            if (q.includes("emoc")) stats.emocion[v] = (stats.emocion[v] || 0) + 1;
            else if (q.includes("motiv")) stats.motivacion[v] = (stats.motivacion[v] || 0) + 1;
            else if (q.includes("aten") || q.includes("clase")) stats.atencion[v] = (stats.atencion[v] || 0) + 1;
            else if (q.includes("energ")) stats.energia[v] = (stats.energia[v] || 0) + 1;
            else if (q.includes("ambi")) stats.ambiente[v] = (stats.ambiente[v] || 0) + 1;
            else if (q.includes("acom") || q.includes("amig")) stats.acompanamiento[v] = (stats.acompanamiento[v] || 0) + 1;
            else if (q.includes("tema")) stats.tema[v] = (stats.tema[v] || 0) + 1;
        });
    });

    return stats;
}

// ----------------------------------------------------
// IA CONFIG
// ----------------------------------------------------
let openai = null;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log("OPENAI ACTIVADO ✔️");
} else {
    console.log("⚠️ OPENAI_API_KEY NO CONFIGURADO — MODO SIN IA");
}

// ----------------------------------------------------
// FORMATEAR RECOMENDACIONES (NO JSON)
// ----------------------------------------------------
function formatRecommendations(recs) {
    return recs.map(r => ({
        title: r.title || "Recomendación",
        areas_minedu: Array.isArray(r.areas_minedu) ? r.areas_minedu : [],
        summary: r.summary || "",
        duration_min: r.duration_min || 20,
        steps: Array.isArray(r.steps) ? r.steps : [],
        materials: Array.isArray(r.materials) ? r.materials : [],
        ref_unit: r.ref_unit || "Unidad X"
    }));
}


// ----------------------------------------------------
// IA — RECOMENDACIONES (MODIFICADO SEGÚN MANUAL MINEDU)
// ----------------------------------------------------
app.post("/api/ia/recomendaciones", async (req, res) => {
    try {
        const { aulaId } = req.body;

        if (!aulaId)
            return res.status(400).json({ error: "Falta aulaId" });

        const rowsRaw = db.prepare("SELECT data FROM responses WHERE aula_id = ?").all(aulaId);
        const parsed = rowsRaw.map(r => safeParse(r.data)).filter(Boolean);

        const stats = extractStats(parsed);

        if (!openai) {
            return res.json({
                stats,
                recs: [{
                    title: "IA desactivada",
                    text: "Configura tu OPENAI_API_KEY"
                }]
            });
        }

        // ----------------------------------------------------
        // NUEVO PROMPT MINEDU — OPTIMIZADO PARA GPT-4o-mini
        // ----------------------------------------------------
        const prompt = `
Eres un especialista peruano en Tutoría y Orientación Educativa del Ministerio de Educación (MINEDU).
Genera recomendaciones pedagógicas que sean:
- basadas en el “Manual de Tutoría y Orientación Educativa” del MINEDU (obligatorio),
- pero también creativas y generativas,
- siempre manteniendo coherencia con los enfoques, áreas y unidades del manual.

### BASE DOCUMENTAL (OBLIGATORIA)
Usa como fundamento el manual en sus unidades:
- Unidad 1: marco conceptual, pilares y áreas oficiales de la tutoría.  
- Unidad 2: sesiones por cada área (personal social, académica, vocacional, salud corporal y mental,
  ayuda social, cultura y actualidad, convivencia y disciplina escolar).
- Unidad 3: prevención y detección de riesgos (depresión, ansiedad, violencia, drogas, sexualidad, TIC).
- Unidad 4: convivencia democrática, buen trato, derechos humanos.
- Unidad 5: recuperación socioemocional tras desastres.

### ORIENTACIÓN
Genera **2 o 3 recomendaciones**, según la necesidad detectada en las estadísticas reales del aula.
Cada recomendación puede trabajar **1 o 2 áreas de tutoría**, según análisis pedagógico.

Las 7 áreas oficiales (obligatorias) son:
1. Personal Social
2. Académica
3. Vocacional
4. Salud Corporal y Mental
5. Ayuda Social
6. Cultura y Actualidad
7. Convivencia y Disciplina Escolar

### FORMATO DE CADA RECOMENDACIÓN (SECCIONES SEPARADAS)
Debe incluir los siguientes campos obligatoriamente:

- "title": título breve.
- "areas_minedu": lista con 1 o 2 áreas oficiales.
- "summary": justificación pedagógica clara (explicar por qué esta recomendación es necesaria,
  vinculando la necesidad con el manual).
- "duration_min": duración estimada en minutos.
- "steps": pasos concretos.
- "materials": materiales simples.
- "ref_unit": una unidad del manual (Unidad 1, 2, 3, 4 o 5).

### ESTADÍSTICAS REALES DEL AULA
${JSON.stringify(stats, null, 2)}

### GENERA LA RESPUESTA ÚNICAMENTE EN JSON:
{
 "recs": [
   {
     "title": "",
     "areas_minedu": [],
     "summary": "",
     "duration_min": 20,
     "steps": [],
     "materials": [],
     "ref_unit": "Unidad X"
   }
 ]
}
 Si falta algún campo, no generes la respuesta.
Asegúrate de que todas las recomendaciones tengan summary, steps y materials.
NO añadas nada fuera del JSON. 
NO escribas explicaciones.
NO uses comillas triples ni bloques de código.
Debes devolver SOLO el JSON puro, sin texto adicional.


`;

        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
                { role: "system", content: "Eres experto en tutoría escolar del Perú." },
                { role: "user", content: prompt }
            ],
            max_tokens: 700,
            temperature: 0.25
        });

        const raw = completion.choices?.[0]?.message?.content || "";

        // ----------------------------------------------------
        // PARSEO JSON SEGURO
        // ----------------------------------------------------
        let recs = [];
        try {
            const jsonStart = raw.indexOf("{");
            recs = JSON.parse(raw.slice(jsonStart)).recs || [];
        } catch {

            // --- LIMPIEZA DEL POSIBLE BLOQUE JSON MAL FORMADO ---
            let cleaned = raw
                .replace(/```json/gi, "")
                .replace(/```/g, "")
                .trim();

            try {
                const extracted = JSON.parse(cleaned);

                if (extracted.recs && Array.isArray(extracted.recs)) {
                    recs = extracted.recs;
                } else {
                    // fallback 1
                    let fallbackText = cleaned
                        .replace(/[{}"]/g, "")
                        .replace(/recs:/gi, "")
                        .trim();

                    recs = [{
                        title: "Recomendación IA (fallback)",
                        text: fallbackText
                    }];
                }

            } catch (err) {

                // fallback 2
                let fallbackText = cleaned
                    .replace(/[{}"]/g, "")
                    .replace(/recs:/gi, "")
                    .trim();

                if (fallbackText.length > 400) {
                    fallbackText = fallbackText.slice(0, 400) + "...";
                }

                recs = [{
                    title: "Recomendación IA (formato no estándar)",
                    text: fallbackText
                }];
            }
        }

        const formatted = formatRecommendations(recs);

        return res.json({ stats, recs: formatted });

    } catch (err) {
        console.error("ERROR IA:", err);
        return res.status(500).json({ error: "Error interno IA", detail: err.message });
    }
});

// ----------------------------------------------------
// RUN SERVER
// ----------------------------------------------------

// Ruta raíz → sirve el index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor corriendo en el puerto " + PORT);
});



