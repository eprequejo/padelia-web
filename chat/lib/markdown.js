// chat/lib/markdown.js

const norm = (s) => (s || "").trim().toLowerCase();
const isAction = (t) => t === "inscribirme" || t === "más info" || t === "mas info";

function iconFor(label){
  const t = norm(label);
  if (t.includes("cuándo")) return "📅";
  if (t.includes("dónde")) return "📍";
  if (t.includes("categor")) return "🏷️";
  if (t.includes("precio")) return "💶";
  if (t.includes("pistas")) return "🎾";
  if (t.includes("servicios")) return "✨";
  if (t.includes("teléfono") || t.includes("telefono")) return "📞";
  return "•";
}

function cleanLabel(raw){
  return (raw || "")
    .replaceAll("¿", "")
    .replaceAll("?", "")
    .replaceAll(":", "")
    .trim();
}

/**
 * Convierte links bajo "Acciones:" en botones (.btn/.btn--primary/.btn--ghost)
 */
export function enhanceActionButtons(bubble) {
  const candidates = Array.from(bubble.querySelectorAll("li, p"))
    .filter((el) => norm(el.textContent).includes("acciones"));

  for (const el of candidates) {
    const links = Array.from(el.querySelectorAll("a"));
    const actionLinks = links.filter((a) => isAction(norm(a.textContent)));
    if (!actionLinks.length) continue;

    const row = document.createElement("div");
    row.className = "actionsRow";

    // Inscribirme primero
    actionLinks.sort((a, b) => (norm(a.textContent) === "inscribirme" ? -1 : 1));

    actionLinks.forEach((a) => {
    const t = norm(a.textContent);

    // 👉 Primary logic:
    // - Inscribirme siempre es primary
    // - Si NO hay "Inscribirme", entonces "Más info" (club) es primary
    const hasInscribirme = actionLinks.some(
        (x) => norm(x.textContent) === "inscribirme"
    );

    const isPrimary =
        t === "inscribirme" ||
        (t === "más info" && !hasInscribirme);

    a.classList.add("btn");
    a.classList.toggle("btn--primary", isPrimary);
    a.classList.toggle("btn--ghost", !isPrimary);

    // 👉 Copy orientado a negocio: clubs = "Ver club"
    if (t === "más info" && !hasInscribirme) {
        a.textContent = "Ver club";
    }

    a.target = "_blank";
    a.rel = "noopener noreferrer";

    row.appendChild(a);
    });

    el.textContent = "";
    el.appendChild(row);
  }
}

/**
 * Convierte filas tipo "¿Cuándo?/¿Dónde?/Pistas/Servicios/Teléfono/..." en .metaRow
 * Importante: se ejecuta tras marked.parse(text)
 */
export function enhanceMetaRows(bubble){
  if (!bubble.closest(".msg--bot")) return;

  // ⬅️ Aquí está la magia: clubs a veces viene en <p>, no en <li>
  const nodes = Array.from(bubble.querySelectorAll("li, p"));

  for (const node of nodes) {
    const txt = (node.textContent || "").trim();
    if (!txt) continue;

    // Detecta separador (¿...? o :)
    let rawLabel = "";
    let value = "";

    if (txt.includes("?")) {
      const idx = txt.indexOf("?");
      rawLabel = txt.slice(0, idx + 1);
      value = txt.slice(idx + 1).trim();
    } else if (txt.includes(":")) {
      const idx = txt.indexOf(":");
      rawLabel = txt.slice(0, idx + 1);
      value = txt.slice(idx + 1).trim();
    } else {
      continue;
    }

    const label = cleanLabel(rawLabel);
    const ln = norm(label);

    // Labels soportados (torneos + clubs)
    const allowed = [
      "cuándo",
      "dónde",
      "categorías",
      "precio mínimo",
      "pistas",
      "servicios",
      "teléfono",
      "telefono",
    ].some((k) => ln.startsWith(k));

    if (!allowed) continue;

    const row = document.createElement("div");
    row.className = "metaRow";

    const icon = document.createElement("span");
    icon.className = "metaIcon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = iconFor(label);

    const lab = document.createElement("span");
    lab.className = "metaLabel";
    lab.textContent = label;

    const val = document.createElement("span");
    val.className = "metaValue";

    // Teléfono clickable
    if (ln.startsWith("tel")) {
      const num = value.replace(/[^\d+]/g, "");
      const a = document.createElement("a");
      a.href = `tel:${num}`;
      a.textContent = value;
      a.className = "metaLink";
      val.appendChild(a);
    } else {
      val.textContent = value;
    }

    row.appendChild(icon);
    row.appendChild(lab);
    row.appendChild(val);

    node.replaceWith(row);
  }
}
