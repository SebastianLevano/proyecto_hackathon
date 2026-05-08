
/* Teacher dashboard: charts, classroom responses, and AI recommendations. */
  Chart.register(ChartDataLabels);

const btnLogin = document.getElementById('btnLogin');
const btnDemo = document.getElementById('btnDemo');
const btnRefresh = document.getElementById('btnRefresh');
const btnExport = document.getElementById('btnExport');
const btnAnalyze = document.getElementById('btnAnalyze');
const btnIArefresh = document.getElementById('btnIArefresh');

const iaTopBand = document.getElementById('iaTopBand');
const iaTopCards = document.getElementById('iaTopCards');
const iaNarrative = document.getElementById('iaNarrative');
const iaRecsList = document.getElementById('iaRecsList');
const iaStatus = document.getElementById('iaStatus');

let currentAulaId = null;
let teacherName = null;
let autoRefresh = null;

btnLogin.addEventListener('click', async () => {
  const u = document.getElementById('inpUser').value.trim();
  const p = document.getElementById('inpPass').value.trim();

  if (!u || !p) {
    document.getElementById('loginMsg').textContent = 'Ingrese usuario y contraseña.';
    return;
  }

  document.getElementById('loginMsg').textContent = 'Iniciando...';

  try {
    const resp = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });

    const d = await resp.json();

    if (!resp.ok) {
      document.getElementById('loginMsg').textContent = d.error || 'Credenciales inválidas';
      return;
    }

    teacherName = d.username || d.user || 'Docente';
    currentAulaId = d.aulaId || d.aula_id || null;

    if (!currentAulaId) {
      document.getElementById('loginMsg').textContent = "Aula no asignada.";
      return;
    }

    const aulasResp = await fetch('/api/aulas');
    const aulasList = await aulasResp.json();
    const aula = aulasList.find(a => parseInt(a.id) === parseInt(currentAulaId));
    const aulaNombre = aula ? aula.nombre : `Aula ${currentAulaId}`;

    document.getElementById('teacherTitle').innerHTML = `Docente: <strong>${teacherName}</strong>`;
document.getElementById('aulaTitle').textContent = `Aula — ${aulaNombre}`;

    document.getElementById('loginWrap').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.body.classList.remove('login-mode');
document.body.classList.add('dashboard-mode');
    document.getElementById('loginMsg').textContent = '';

    await loadAll();

    if (autoRefresh) clearInterval(autoRefresh);
    // auto-refresh LOAD DATA only (no IA)
    autoRefresh = setInterval(() => loadRaw(currentAulaId), 45000);

  } catch (e) {
    console.error(e);
    document.getElementById('loginMsg').textContent = 'Error al conectar con el servidor.';
  }
});

btnDemo.addEventListener('click', async ()=>{
  teacherName = 'Profesor Demo'; currentAulaId = 1;
  document.getElementById('teacherTitle').innerHTML = `Docente: <strong>${teacherName}</strong>`;
  document.getElementById('aulaTitle').textContent = `Aula: Demo (id: ${currentAulaId})`;
  document.getElementById('loginWrap').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  await loadAll();
  if (autoRefresh) clearInterval(autoRefresh);
  autoRefresh = setInterval(()=>loadRaw(currentAulaId), 45000);
});

btnRefresh.addEventListener('click', ()=> loadRaw(currentAulaId));
const btnLogout = document.getElementById('btnLogout');
btnLogout.addEventListener('click', () => {
  currentAulaId = null;
  teacherName = null;

  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('loginWrap').style.display = 'block';

  document.body.classList.remove('dashboard-mode');
  document.body.classList.add('login-mode');

  document.getElementById('inpUser').value = '';
  document.getElementById('inpPass').value = '';

  iaTopBand.innerHTML = '';
  iaTopCards.innerHTML = '';
  iaNarrative.innerHTML = '';
  iaRecsList.innerHTML = '';
  iaNarrative.style.display = 'none';

  if (autoRefresh) clearInterval(autoRefresh);

  // 🔥 reemplazo del alert
  const toast = document.getElementById("toast");

  toast.classList.remove("hidden");
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.classList.add("hidden"), 300);
  }, 1500);
});

btnExport.addEventListener('click', exportResponses);
btnAnalyze.addEventListener('click', async ()=> {
   const payload = await loadAnalyze(currentAulaId);
   if(payload) {
       renderAdvancedPanel(payload);
       iaStatus.textContent = 'Análisis IA actualizado: ' + new Date().toLocaleTimeString();
   }
});
btnIArefresh.addEventListener('click', async ()=> { await loadIApanel(); });

async function loadAll(){
  if(!currentAulaId){ alert('Aula no asignada'); return; }
  await loadRaw(currentAulaId);   // only load data (no IA)
}

function volverInicio(){
  window.location.href = "/";
}

/* Helper to normalize various response shapes and include 'tema' */
function extractFieldsFromResponse(r) {
  const out = { emocion:'', motivacion:'', atencion:'', energia:'', ambiente:'', acompanamiento:'', tema:'', notes:[] };

  // r may be { data: {...} } or already-parsed object
  let d = (r && r.data !== undefined) ? r.data : r;

  if (typeof d === "string") {
    try { d = JSON.parse(d); } catch(e){ d = {}; }
  }
  if (!d || typeof d !== 'object') return out;

  // answers[] preferred
  if (Array.isArray(d.answers)) {
    d.answers.forEach(a=>{
      const q = (a.qid||'').toLowerCase();
      const v = (a.value||'').toString();
      if (q.includes('emoc')) out.emocion = v;
      else if (q.includes('motiv')) out.motivacion = v;
      else if (q.includes('ener')) out.energia = v;
      else if (q.includes('aten')||q.includes('part')||q.includes('clase')) out.atencion = v;
      else if (q.includes('ambi')) out.ambiente = v;
      else if (q.includes('acom')||q.includes('amig')) out.acompanamiento = v;
      else if (q.includes('tema')) out.tema = v;
      else if (typeof v === 'string' && v.trim().length>2) out.notes.push(v);
    });
    return out;
  }

  // flat keys fallback
  const mapKey = key => {
    const k = key.toLowerCase();
    if (k.includes('emoc')) return 'emocion';
    if (k.includes('motiv')) return 'motivacion';
    if (k.includes('ener')) return 'energia';
    if (k.includes('atenc')||k.includes('part')||k.includes('clase')) return 'atencion';
    if (k.includes('ambi')) return 'ambiente';
    if (k.includes('acomp')||k.includes('amig')) return 'acompanamiento';
    if (k.includes('tema')) return 'tema';
    return null;
  };

  Object.entries(d).forEach(([k,v])=>{
    const mk = mapKey(k);
    if (mk) out[mk] = (v||'').toString();
    else if (typeof v === 'string' && v.trim().length>2) out.notes.push(v);
  });

  return out;
}

/* LOAD RAW: obtiene respuestas y actualiza todos los gráficos */
async function loadRaw(aulaId){
  if(!aulaId){ console.warn('loadRaw: falta aulaId'); return; }
  try {
    const res = await fetch(`/api/respuestas/${aulaId}`);
    if(!res.ok){
      document.getElementById('totalResponses').textContent = '0';
      document.getElementById('lastUpdated').textContent = '—';
      document.getElementById('alertsArea').innerHTML = '<div class="small">No se pueden obtener respuestas.</div>';
      return;
    }
    const arr = await res.json();

    // totals
    const totals = { emocion:{}, motivacion:{}, atencion:{}, energia:{}, ambiente:{}, acompanamiento:{}, tema:{}, notes:[] };

    arr.forEach(r=>{
      const e = extractFieldsFromResponse(r);
      if(e.emocion) totals.emocion[e.emocion] = (totals.emocion[e.emocion]||0)+1;
      if(e.motivacion) totals.motivacion[e.motivacion] = (totals.motivacion[e.motivacion]||0)+1;
      if(e.atencion) totals.atencion[e.atencion] = (totals.atencion[e.atencion]||0)+1;
      if(e.energia) totals.energia[e.energia] = (totals.energia[e.energia]||0)+1;
      if(e.ambiente) totals.ambiente[e.ambiente] = (totals.ambiente[e.ambiente]||0)+1;
      if(e.acompanamiento) totals.acompanamiento[e.acompanamiento] = (totals.acompanamiento[e.acompanamiento]||0)+1;
      if(e.tema) totals.tema[e.tema] = (totals.tema[e.tema]||0)+1;
      if(e.notes && e.notes.length) totals.notes.push(...e.notes);
    });

    document.getElementById('totalResponses').textContent = arr.length;
    document.getElementById('lastUpdated').textContent = new Date().toLocaleString();

    // KPIs
    const total = arr.length || 1;
    const pct = n => Math.round((n/total)*100);

    const alegria = totals.emocion['😄 Alegría'] || totals.emocion['Alegría'] || totals.emocion['Alegria'] || 0;
    const stress = (totals.emocion['😣 Estrés']||0) + (totals.emocion['😟 Ansiedad']||0) + (totals.emocion['Estrés']||0) + (totals.emocion['Ansiedad']||0);
    const motAlta = totals.motivacion['Alta 🔥'] || totals.motivacion['Alta'] || 0;
    const enerAlta = totals.energia['Alta 🔋'] || totals.energia['Alta'] || 0;
    const tristeza = totals.emocion['😔 Tristeza'] || totals.emocion['Tristeza'] || 0;
const ambienteTenso = 
    (totals.ambiente['Tenso'] || 0) +
    (totals.ambiente['Difícil'] || totals.ambiente['Dificil'] || 0);


    document.getElementById('kpiAlegria').textContent = pct(alegria) + '%';
    document.getElementById('kpiStress').textContent = pct(stress) + '%';
    document.getElementById('kpiMotAlta').textContent = pct(motAlta) + '%';
    document.getElementById('kpiEnerAlta').textContent = pct(enerAlta) + '%';
    document.getElementById('kpiTristeza').textContent = pct(tristeza) + '%';
document.getElementById('kpiAmbTenso').textContent = pct(ambienteTenso) + '%';


    // Prepare each chart dataset and render individually
    // 1) Emociones (order fixed)
    const emotionLabels = ['😄 Alegría','🙂 Tranquilidad','😐 Neutral','😣 Estrés','😔 Tristeza','😕 Confusión','😡 Molestia','😴 Cansancio','😟 Ansiedad'];
    const emotionData = emotionLabels.map(l => totals.emocion[l] || totals.emocion[l.replace(/^[^ ]+ /,'')] || 0);
renderHorizontalBar('chartEmotions', emotionLabels, emotionData);

    // 2) Motivación
    const motLabels = ['Alta 🔥','Media 🙂','Baja 😴'];
    const motData = motLabels.map(l => totals.motivacion[l] || totals.motivacion[l.split(' ')[0]] || 0);
renderDoughnut('chartMotivation', motLabels, motData);

    // 3) Atención
    const atLabels = ['Súper atento','Atento a medias','Perdido','Cansado'];
    const atData = atLabels.map(l => totals.atencion[l] || 0);
renderBar('chartAttention', atLabels, atData);

    // 4) Energía
    const enerLabels = ['Alta 🔋','Media 🔋','Baja 🪫'];
    const enerData = enerLabels.map(l => totals.energia[l] || totals.energia[l.split(' ')[0]] || 0);
renderLine('chartEnergy', enerLabels, enerData);

    // 5) Ambiente (pie)
    const ambLabels = ['Muy bueno','Bueno','Normal','Tenso','Difícil'];
    const ambData = ambLabels.map(l => totals.ambiente[l] || 0);
renderPie('chartAmbiente', ambLabels, ambData);

    // 6) Acompañamiento
    const compLabels = ['Sí','Más o menos','No'];
    const compData = compLabels.map(l => totals.acompanamiento[l] || totals.acompanamiento[l.replace('í','i')] || 0);
renderRadar('chartAcompanamiento', compLabels, compData);

    // 7) Tema (pie / bar)
    const temaLabels = Object.keys(totals.tema || {});
    const temaData = temaLabels.map(k => totals.tema[k] || 0);
    if(temaLabels.length) {
      renderPie('chartTema', temaLabels, temaData);
    } else {
      renderPie('chartTema', ['Sin datos'], [1]);
    }

    // Build alerts & simple recommendations (heuristics)
    const alerts = [];
    const recs = [];
    if(pct(stress) >= 25) {
      alerts.push('Alto nivel de estrés/ansiedad en el aula (≥25%).');
      recs.push({ title: 'Tutoría emocional — sesión de contención', desc: '20-30 min: respiración, escucha activa, grupos pequeños. Derivar si hay riesgo.' , source:'Unidad 3' });
    } else if(pct(stress) >= 10) {
      alerts.push('Incremento de señales de estrés (≥10%).');
      recs.push({ title: 'Ejercicio de regulación (5-10 min)', desc: 'Respiración guiada y mini-rutina de atención.' , source:'Unidad 2' });
    }
    if(pct(motAlta) <= 30) {
      recs.push({ title: 'Actividad motivacional breve', desc: 'Dinámica de metas a corto plazo y reconocimiento en clase.' , source:'Unidad 1' });
    }
    const lostPct = Math.round(((totals.atencion['Perdido']||0)/total)*100);
    if(lostPct >= 20) {
      alerts.push('Alta proporción de estudiantes "Perdido" en clase (≥20%).');
      recs.push({ title: 'Dinámica de atención y participación', desc: 'Roles rotativos y actividades cortas con feedback.' , source:'Unidad 4' });
    }

    const alertsArea = document.getElementById('alertsArea');
    alertsArea.innerHTML = alerts.length ? alerts.map(a=>`<div style="padding:8px;border-left:4px solid ${a.toLowerCase().includes('alto')? 'var(--danger)':'var(--warn)'};margin-bottom:6px">${a}</div>`).join('') : '<div class="small">Sin alertas críticas</div>';

    // Store last totals on window for IA panel use
    window.__aulaTotals = totals;
    window.__aulaRawCount = arr.length;

  } catch (err) {
    console.error('loadRaw error', err);
    const alertsArea = document.getElementById('alertsArea');
    alertsArea.innerHTML = `<div class="ia-warn">Error al obtener datos del servidor.</div>`;
  }
}

/* CHART HELPERS */
let chartInstances = {};
function renderBar(id, labels, data){
const canvas = document.getElementById(id);
  canvas.parentNode.style.height = "300px";
  if(chartInstances[id]) chartInstances[id].destroy();
  const ctx = document.getElementById(id).getContext('2d');

  chartInstances[id] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: labels.map((_,i)=> `hsl(${(i*40)%360} 80% 55%)`)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: { display: false },

        datalabels: {
       anchor: 'center',
  align: 'center',
  color: '#fff',
  font: { weight: 'bold', size: 12 },

          formatter: (value, ctx) => {
            const total = ctx.chart.data.datasets[0].data.reduce((a,b)=>a+b,0);
            if (!total || value === 0) return "";
            return Math.round((value/total)*100) + "%";
          }
        }
      },

      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

function renderPie(id, labels, data){
  if(chartInstances[id]) chartInstances[id].destroy();
  const ctx = document.getElementById(id).getContext('2d');
  chartInstances[id] = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: labels.map((_,i)=> `hsl(${(i*60)%360} 70% 50%)`)
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        datalabels: {
          color: '#fff',
          font: { weight: 'bold', size: 14 },
          formatter: (value, ctx) => {
            const total = ctx.chart.data.datasets[0].data.reduce((a,b)=>a+b,0) || 1;
            return Math.round((value/total)*100) + "%";
          }
        }
      }
    }
  });
}


function renderHorizontalBar(id, labels, data){
  if(chartInstances[id]) chartInstances[id].destroy();
  const ctx = document.getElementById(id).getContext('2d');

  chartInstances[id] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: labels.map((_,i)=> `hsl(${(i*35)%360} 70% 50%)`)
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: { display: false },

        datalabels: {
          anchor: 'center',     /* ← dentro de la barra */
          align: 'center',      /* ← centrado total */
          color: '#fff',
          font: { weight: 'bold', size: 12 },

          formatter: (value, ctx) => {
            const total = ctx.chart.data.datasets[0].data.reduce((a,b)=>a+b,0);
            if (!total || value === 0) return "";
            return Math.round((value/total)*100) + "%";
          }
        }
      },

      scales: {
        x: { beginAtZero: true }
      }
    }
  });
}


function renderDoughnut(id, labels, data){
    if(chartInstances[id]) chartInstances[id].destroy();
    const ctx = document.getElementById(id).getContext('2d');
    chartInstances[id] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: labels.map((_, i) => `hsl(${(i*45)%360} 70% 55%)`)
            }]
        },
        options:{
    responsive:true,
   plugins: {
    legend: { position: 'bottom' },
    datalabels: {
   color: '#fff',
  font: { weight: 'bold', size: 14 },
  textAlign: 'center',
        formatter: (value, ctx) => {
            const total = ctx.chart.data.datasets[0].data.reduce((a,b)=>a+b,0);
            if (!total) return "";
            return Math.round((value/total)*100) + "%";
        }
    }
}

}

    });
}

function renderLine(id, labels, data){
    if(chartInstances[id]) chartInstances[id].destroy();
    const ctx = document.getElementById(id).getContext('2d');
    chartInstances[id] = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data,
                borderWidth: 2,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false },
            datalabels:{
    anchor:'end',
    align:'top',
    formatter:(value)=> value
}

        },
            scales: { y: { beginAtZero: true } }
        }
    });
}
function renderRadar(id, labels, data) {
    if (chartInstances[id]) chartInstances[id].destroy();
    const ctx = document.getElementById(id).getContext("2d");
    
    chartInstances[id] = new Chart(ctx, {
        type: "radar",
        data: {
            labels,
            datasets: [{
                data,
                fill: true,
                borderWidth: 2,
                backgroundColor: "rgba(54, 162, 235, 0.2)",
                borderColor: "rgba(54, 162, 235, 1)",
                pointBackgroundColor: "rgba(54, 162, 235, 1)"
            }]
        },
        options: {
            responsive: true,
            plugins:{
    legend:{ display:false },
    datalabels:{
        color:'#000',
        formatter:value => value
    }
}

        }
    });
}

/* Export responses */
async function exportResponses(){
  if(!currentAulaId) return alert('Aula no asignada.');
  const res = await fetch(`/api/respuestas/${currentAulaId}`);
  if(!res.ok) return alert('No se pudo obtener respuestas.');
  const arr = await res.json();
  const blob = new Blob([JSON.stringify(arr, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `responses_aula_${currentAulaId}.json`; a.click();
}

/* IA: Llamada para obtener recomendaciones (no se auto lanza) */
async function loadAnalyze(aulaId){
  if(!aulaId) return alert('Aula no asignada.');
  try{
    const res = await fetch('/api/ia/recomendaciones', {
      method:'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ aulaId })
    });
    if(!res.ok) {
      console.warn('IA endpoint no disponible');
      return null;
    }
    const payload = await res.json();
    // render brief stats in KPIs if provided
    if(payload.stats) renderAnalyzeFromPayload({ stats: payload.stats, totalResponses: payload.stats.total || 0 });
    return payload;
  } catch(e){
    console.error('loadAnalyze error', e);
    return null;
  }
}

/* Ejecuta IA (button) -> obtiene recs y las muestra formateadas */
async function runAnalyze(){
  if(!currentAulaId) return alert('Aula no asignada.');
  const payload = await loadAnalyze(currentAulaId);
  if(!payload) return alert('No se pudo ejecutar IA.');
  // Show IA recs in panelIA area (use renderAdvancedPanel)
  renderAdvancedPanel(payload);
  alert('Análisis IA actualizado.');
}

/* PANEL IA avanzado (botón específico) */
async function loadIApanel(){
  if(!currentAulaId) return;
  iaStatus.innerHTML = '<span class="spinner"></span>Analizando...';
  iaTopBand.innerHTML = '';
  iaTopCards.innerHTML = '';
  iaNarrative.style.display = 'none';
  iaNarrative.innerHTML = '';
  iaRecsList.innerHTML = '';

  try{
    const payload = await loadAnalyze(currentAulaId);
    if(!payload) {
      iaStatus.textContent = 'Error: no se obtuvo respuesta de IA';
      iaTopBand.innerHTML = `<div class="ia-warn">No se pudo obtener análisis IA.</div>`;
      return;
    }
    iaStatus.textContent = 'Último análisis IA: ' + new Date().toLocaleTimeString();
    iaStatus.style.color = 'var(--muted)';
    renderAdvancedPanel(payload);
  }catch(e){
    console.error('loadIApanel error', e);
    iaStatus.textContent = 'Error en IA';
    iaTopBand.innerHTML = `<div class="ia-warn">Error al consultar IA.</div>`;
    iaStatus.style.color = 'var(--danger)';
  }
}

function cleanJsonLikeText(str) {
  if (typeof str !== "string") return str;
  // Si parece JSON, elimino llaves y comillas
  if (str.trim().startsWith("{") || str.trim().startsWith("[")) {
    return str
      .replace(/[{}"]/g, '')
      .replace(/recs:/gi, '')
      .replace(/summary:/gi, '')
      .replace(/title:/gi, '')
      .replace(/\[\s*\]/g, '')
      .trim();
  }
  return str;
}


/* Formatea y pinta el panel avanzado con el payload de backend */
function renderAdvancedPanel(payload){
  const stats = payload.stats || window.__aulaTotals || {};
  const recs = payload.recs || [];
  const total = stats.total || window.__aulaRawCount || 1;
  const pct = n => Math.round((n/Math.max(1,total))*100);

  const stressCount = (stats.emocion && ((stats.emocion['😣 Estrés']||0) + (stats.emocion['😟 Ansiedad']||0))) || 0;
  const tristezaCount = (stats.emocion && (stats.emocion['😔 Tristeza']||0)) || 0;
  const bajaMot = (stats.motivacion && (stats.motivacion['Baja 😴']||stats.motivacion['Baja']||0)) || 0;
  const tensoCount = (stats.ambiente && ((stats.ambiente['Tenso']||0) + (stats.ambiente['Difícil']||0))) || 0;

  let topHtml = '';
  if(pct(stressCount) >= 30 || pct(tensoCount) >= 25){
    topHtml = `<div class="ia-alert"><strong>Atención:</strong> Se detectan riesgos (estrés / clima tenso) en el aula. Revise las recomendaciones y considere acciones de contención.</div>`;
  } else if(pct(tristezaCount) >= 20 || pct(bajaMot) >= 30){
    topHtml = `<div class="ia-warn"><strong>Observación:</strong> Señales de desánimo o motivación baja. Puede requerir actividades motivacionales.</div>`;
  } else {
    topHtml = `<div style="padding:10px;border-left:4px solid var(--good);background:#f0fff4">Estado estable: no hay riesgos críticos detectados.</div>`;
  }
  iaTopBand.innerHTML = topHtml;

  iaTopCards.innerHTML = '';
  const cardData = [
    { title: 'Participación total', value: stats.total || window.__aulaRawCount || 0, sub: 'Respuestas registradas' },
    { title: 'Estrés/Ansiedad', value: pct(stressCount)+'%', sub: 'Proporción del aula' },
    { title: 'Tristeza', value: pct(tristezaCount)+'%', sub: 'Proporción del aula' },
    { title: 'Motivación baja', value: pct(bajaMot)+'%', sub: 'Proporción del aula' }
  ];
  cardData.forEach(c => {
    const el = document.createElement('div');
    el.className = 'ia-card';
    el.innerHTML = `<h4>${c.title}</h4><p style="font-weight:700;font-size:18px;margin-top:6px">${c.value}</p><p class="small" style="margin-top:6px">${c.sub}</p>`;
    iaTopCards.appendChild(el);
  });

  // Narrative (friendly)
  let narrative = '';
  if(Array.isArray(recs) && recs.length && recs[0].narrative){
    narrative = recs[0].narrative;
  } else if(payload.narrative){
    narrative = payload.narrative;
  } else {
    narrative = `La IA detectó ${stats.total || 0} respuesta(s). Principales señales: Estrés/ansiedad ${pct(stressCount)}%, tristeza ${pct(tristezaCount)}%, motivación baja ${pct(bajaMot)}%.`;
    if(pct(stressCount) >= 30 || pct(tensoCount) >= 25){
      narrative += ` Recomendamos priorizar acciones de contención emocional y comunicación con las familias.`;
    } else if(pct(bajaMot) >= 30){
      narrative += ` Sugerimos actividades motivacionales y proyectos cortos para aumentar enganche.`;
    } else {
      narrative += ` La dinámica del aula se considera relativamente estable. Mantener seguimiento.`;
    }
  }
  iaNarrative.style.display = 'block';
  iaNarrative.innerHTML = `<strong>Análisis sintético:</strong><div style="margin-top:8px" class="small">${narrative}</div>`;

 iaRecsList.innerHTML = '';

if (!recs || recs.length === 0) {
  iaRecsList.innerHTML = `<div class="small">No se encontraron recomendaciones automáticas por IA.</div>`;
} else {
  recs.forEach(r => {

const recDiv = document.createElement("div");
recDiv.className = "ia-rec";

    recDiv.innerHTML = `
      <h3 style="margin-top:0;font-size:17px">${r.title || "Recomendación"}</h3>

      ${r.areas_minedu ? `
        <p class="small"><strong>Áreas MINEDU:</strong> 
        ${r.areas_minedu.join(", ")}</p>
      ` : ""}

      ${r.summary ? `
        <p class="small" style="white-space:pre-line">
        <strong>Resumen pedagógico:</strong><br>${r.summary}
        </p>
      ` : ""}

      ${r.steps && r.steps.length ? `
        <p class="small"><strong>Pasos sugeridos:</strong></p>
        <ol class="small" style="margin-top:-8px">
          ${r.steps.map(s => `<li>${s}</li>`).join("")}
        </ol>
      ` : ""}

      ${r.materials && r.materials.length ? `
        <p class="small"><strong>Materiales:</strong><br>
        ${r.materials.map(m => "• " + m).join("<br>")}
        </p>
      ` : ""}

      <p class="small"><strong>Duración:</strong> ${r.duration_min || 20} min</p>
      <p class="meta">Referencia: ${r.manual_ref || r.source || "Unidad MINEDU"}</p>
    `;

    iaRecsList.appendChild(recDiv);
  });
}

}

/* renderAnalyzeFromPayload -> actualiza KPIs si la IA devuelve stats */
function renderAnalyzeFromPayload(payload){
  const stats = payload.stats || {};
  const total = payload.totalResponses || stats.total || 0;
  const pct = (n) => Math.round((n/Math.max(1,total))*100);
  document.getElementById('kpiAlegria').textContent = pct( (stats.emocion && (stats.emocion['😄 Alegría']||stats.emocion['Alegría']||stats.emocion['Alegria'])) || 0 ) + '%';
  document.getElementById('kpiStress').textContent = pct( (stats.emocion && ((stats.emocion['😣 Estrés']||0) + (stats.emocion['😟 Ansiedad']||0) + (stats.emocion['Estrés']||0) + (stats.emocion['Ansiedad']||0))) || 0 ) + '%';
  document.getElementById('kpiMotAlta').textContent = pct( (stats.motivacion && (stats.motivacion['Alta 🔥']||stats.motivacion['Alta']||0)) || 0) + '%';
  document.getElementById('kpiEnerAlta').textContent = pct( (stats.energia && (stats.energia['Alta 🔋']||stats.energia['Alta']||0)) || 0) + '%';
  const emotionLabels = Object.keys(stats.emocion||{});
  const emotionData = emotionLabels.map(k => stats.emocion[k] || 0);
  if(emotionLabels.length) renderBar('chartEmotions', emotionLabels, emotionData);
}

/* Ping backend aulas on load (non-blocking) */
(async function initCheck(){
  try{
    await fetch('/api/aulas');
  }catch(e){ console.log('Backend no disponible en /api/aulas'); }
})();
