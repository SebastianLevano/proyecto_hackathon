
// Render aulas
fetch("/api/aulas")
  .then(r => r.json())
  .then(aulas => {
    const select = document.getElementById("aulaSelect");
    aulas.forEach(a => {
      const op = document.createElement("option");
      op.value = a.id;
      op.textContent = a.nombre;
      select.appendChild(op);
    });
  });

// Chip selector
document.querySelectorAll(".chip-group").forEach(group => {
  group.addEventListener("click", e => {
    if (e.target.classList.contains("chip")) {
      [...group.children].forEach(c => c.classList.remove("selected"));
      e.target.classList.add("selected");
    }
  });
});
function volverInicio(){
  window.location.href = "index.html";
}
// Enviar respuestas
function enviar() {
  const aulaId = document.getElementById("aulaSelect").value;
  if (!aulaId) return showToast("Selecciona tu aula primero", "warning");

  function getSelected(id) {
    const chip = document.querySelector(`#${id} .selected`);
    return chip ? chip.textContent.trim() : "";
  }

  const emocion = getSelected("emocion");
  const motivacion = getSelected("motivacion");
  const atencion = getSelected("atencion");
  const energia = getSelected("energia");
  const ambiente = getSelected("ambiente");
  const acompanamiento = getSelected("acompanamiento");
  const tema = getSelected("tema"); // NUEVA RESPUESTA

  if (!emocion || !motivacion || !atencion || !energia || !ambiente || !acompanamiento || !tema) {
    return showToast("Responde todas las preguntas", "warning");
  }

  // 🌟 Formato correcto
  const data = {
    answers: [
      { qid: "emocion", value: emocion },
      { qid: "motivacion", value: motivacion },
      { qid: "atencion", value: atencion },
      { qid: "energia", value: energia },
      { qid: "ambiente", value: ambiente },
      { qid: "acompanamiento", value: acompanamiento },
      { qid: "tema", value: tema } // NUEVO
    ]
  };

fetch("/api/respuestas", {
  method: "POST",
  headers: {"Content-Type":"application/json"},
  body: JSON.stringify({ aulaId, data })
})

 .then(() => {
  showToast("¡Respuestas enviadas correctamente!", "success");

  // limpiar formulario
  document.getElementById("aulaSelect").value = "";
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("selected"));

  // 👇 nueva pantalla después del toast
  setTimeout(() => {
    mostrarPantallaFinal();
  }, 800);
});
}
function showToast(message, type="success"){
  const toast = document.getElementById("toast");
  const content = document.getElementById("toastContent");

  const icons = {
    success: "✔️",
    error: "❌",
    warning: "⚠️"
  };

  content.innerHTML = `${icons[type]} ${message}`;

  toast.className = `toast ${type}`;
  toast.classList.remove("hidden");

setTimeout(()=>{
  toast.classList.add("hide");
  setTimeout(()=> toast.classList.add("hidden"), 300);
}, 3000);
}

function mostrarPantallaFinal(){
  document.getElementById("finalScreen").classList.remove("hidden");
}

function volverInicio(){
  window.location.href = "/";
}

console.log("🔵 estudiante.html cargó en Render");

fetch("/api/aulas")
  .then(r => r.json())
  .then(aulas => {
    console.log("🟢 Aulas recibidas desde backend:", aulas);
  })
  .catch(err => console.error("🔴 Error fetch aulas:", err));
