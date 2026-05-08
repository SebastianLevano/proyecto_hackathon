/* AulaSense — encuesta del estudiante */

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
  })
  .catch(err => console.error("Error fetch aulas:", err));

/* Selección de chip (click + teclado) */
document.querySelectorAll(".chip-group").forEach(group => {
  group.addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    selectChip(group, chip);
  });

  group.addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const chip = e.target.closest(".chip");
    if (!chip) return;
    e.preventDefault();
    selectChip(group, chip);
  });
});

function selectChip(group, chip) {
  [...group.children].forEach(c => {
    c.classList.remove("selected");
    c.setAttribute("aria-checked", "false");
  });
  chip.classList.add("selected");
  chip.setAttribute("aria-checked", "true");

  const card = group.closest(".card");
  if (card) card.classList.remove("is-missing");
}

document.getElementById("aulaSelect").addEventListener("change", e => {
  const card = e.target.closest(".card");
  if (e.target.value && card) card.classList.remove("is-missing");
});

function getSelected(id) {
  const chip = document.querySelector(`#${id} .selected`);
  return chip ? chip.textContent.trim() : "";
}

async function enviar() {
  const btn = document.getElementById("btnSubmit");
  const aulaId = document.getElementById("aulaSelect").value;

  const fields = [
    { id: "emocion", card: "card-emocion", label: "emoción" },
    { id: "motivacion", card: "card-motivacion", label: "motivación" },
    { id: "atencion", card: "card-atencion", label: "atención" },
    { id: "energia", card: "card-energia", label: "energía" },
    { id: "ambiente", card: "card-ambiente", label: "ambiente" },
    { id: "acompanamiento", card: "card-acompanamiento", label: "acompañamiento" },
    { id: "tema", card: "card-tema", label: "tema" }
  ];

  // Validación visual
  let firstMissing = null;
  document.querySelectorAll(".card.is-missing").forEach(c => c.classList.remove("is-missing"));

  if (!aulaId) {
    const aulaCard = document.getElementById("aulaSelect").closest(".card");
    aulaCard.classList.add("is-missing");
    firstMissing = aulaCard;
  }

  const values = {};
  for (const f of fields) {
    values[f.id] = getSelected(f.id);
    if (!values[f.id]) {
      const card = document.getElementById(f.card);
      card.classList.add("is-missing");
      if (!firstMissing) firstMissing = card;
    }
  }

  if (firstMissing) {
    firstMissing.scrollIntoView({ behavior: "smooth", block: "center" });
    return showToast("Responde todas las preguntas", "warning");
  }

  const data = {
    answers: fields.map(f => ({ qid: f.id, value: values[f.id] }))
  };

  // Loading
  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner" aria-hidden="true"></span>Enviando...`;

  try {
    const res = await fetch("/api/respuestas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aulaId, data })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || "No se pudieron enviar las respuestas", "error");
      btn.disabled = false;
      btn.textContent = originalLabel;
      return;
    }

    showToast("¡Respuestas enviadas correctamente!", "success");
    document.getElementById("aulaSelect").value = "";
    document.querySelectorAll(".chip").forEach(c => {
      c.classList.remove("selected");
      c.setAttribute("aria-checked", "false");
    });

    setTimeout(() => mostrarPantallaFinal(), 800);
  } catch (e) {
    console.error(e);
    showToast("Error de conexión con el servidor", "error");
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const content = document.getElementById("toastContent");

  const icons = {
    success: "✓",
    error: "✕",
    warning: "!"
  };

  content.innerHTML = `<span aria-hidden="true">${icons[type]}</span> ${message}`;

  toast.className = `toast ${type}`;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => {
      toast.classList.add("hidden");
      toast.classList.remove("hide");
    }, 300);
  }, 3000);
}

function mostrarPantallaFinal() {
  document.getElementById("finalScreen").classList.remove("hidden");
}

function volverInicio() {
  window.location.href = "/";
}
