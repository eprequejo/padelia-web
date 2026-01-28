// chat/lib/markdown.js

const norm = (s) => (s || "").trim().toLowerCase();
const isAction = (t) => t === "inscribirme" || t === "más info" || t === "mas info";

function iconFor(label){
  const t = norm(label);
  if (t.includes("cuándo")) return "📅";
  if (t.includes("dónde")) return "📍";
  if (t.includes("categor")) return "🏷️";
  if (t.includes("precio")) return "💶";
  return "•";
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

      a.classList.add("btn");
      a.classList.toggle("btn--primary", t === "inscribirme");
      a.classList.toggle("btn--ghost", t !== "inscribirme");

      a.target = "_blank";
      a.rel = "noopener noreferrer";

      row.appendChild(a);
    });

    el.textContent = "";
    el.appendChild(row);
  }
}

/**
 * Convierte bullets tipo "¿Cuándo? ..." en filas visuales (.metaRow)
 * Importante: se ejecuta tras marked.parse(text)
 */
export function enhanceMetaRows(bubble){
  // Solo si es burbuja de bot
  if (!bubble.closest(".msg--bot")) return;

  const lis = Array.from(bubble.querySelectorAll("li"));

  for (const li of lis) {
    const txt = (li.textContent || "").trim();

    const m = txt.match(/^(¿Cuándo\?|¿Dónde\?|Categorías:|Precio mínimo:)\s*(.*)$/i);
    if (!m) continue;

    const label = m[1];
    const value = m[2] || "";

    const row = document.createElement("div");
    row.className = "metaRow";

    const icon = document.createElement("span");
    icon.className = "metaIcon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = iconFor(label);

    const lab = document.createElement("span");
    lab.className = "metaLabel";
    lab.textContent = label.replace("¿", "").replace("?", "").replace(":", "").trim();

    const val = document.createElement("span");
    val.className = "metaValue";
    val.textContent = value.trim();

    row.appendChild(icon);
    row.appendChild(lab);
    row.appendChild(val);

    li.replaceWith(row);
  }
}
