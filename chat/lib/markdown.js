// chat/lib/markdown.js

import { trackEvent } from "./analytics.js";
import { getUserId, getThreadId } from "./storage.js";

const norm = (s) => (s || "").trim().toLowerCase();
const isAction = (t) => t === "inscribirme" || t === "más info" || t === "mas info";

function iconFor(label){
  const t = norm(label);
  if (t.includes("cuándo")) return "📅";
  if (t.includes("dónde")) return "📍";
  if (t.includes("categor")) return "🏷️";
  if (t.includes("precio")) return "💰";
  return "•";
}

function cleanLabel(raw){
  return (raw || "")
    .replaceAll("¿", "")
    .replaceAll("?", "")
    .replaceAll(":", "")
    .trim();
}

// 🎨 Helpers para formatear fechas
function formatDate(dateStr) {
  if (!dateStr) return "";
  
  try {
    const date = new Date(dateStr + "T00:00:00");
    const weekday = date.toLocaleDateString("es-ES", { weekday: "short" });
    const day = date.getDate();
    const month = date.toLocaleDateString("es-ES", { month: "long" });
    
    const weekdayCapitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    
    return `${weekdayCapitalized} ${day} de ${month}`;
  } catch (e) {
    return dateStr;
  }
}

function formatDateRange(start, end) {
  if (!start) return "";
  if (!end || start === end) return formatDate(start);
  
  try {
    const startDate = new Date(start + "T00:00:00");
    const endDate = new Date(end + "T00:00:00");
    
    const startWeekday = startDate.toLocaleDateString("es-ES", { weekday: "short" });
    const startDay = startDate.getDate();
    
    const endWeekday = endDate.toLocaleDateString("es-ES", { weekday: "short" });
    const endDay = endDate.getDate();
    const endMonth = endDate.toLocaleDateString("es-ES", { month: "long" });
    
    const startCapitalized = startWeekday.charAt(0).toUpperCase() + startWeekday.slice(1);
    const endCapitalized = endWeekday.charAt(0).toUpperCase() + endWeekday.slice(1);
    
    // Mismo mes
    if (startDate.getMonth() === endDate.getMonth()) {
      return `${startCapitalized} ${startDay} - ${endCapitalized} ${endDay} de ${endMonth}`;
    }
    
    // Meses diferentes
    const startMonth = startDate.toLocaleDateString("es-ES", { month: "long" });
    return `${startCapitalized} ${startDay} de ${startMonth} - ${endCapitalized} ${endDay} de ${endMonth}`;
    
  } catch (e) {
    return `${start} - ${end}`;
  }
}

function formatCategories(categoriesStr) {
  if (!categoriesStr) return "";
  
  const cats = categoriesStr.toLowerCase().split(",").map(c => c.trim());
  
  const masc = [];
  const fem = [];
  const mixto = [];
  
  cats.forEach(cat => {
    // Extraer el número/nivel
    const match = cat.match(/(\d+[ab]?)/i);
    if (!match) return;
    
    const level = match[1].toUpperCase();
    
    if (cat.includes("masculin")) {
      masc.push(level);
    } else if (cat.includes("femenin")) {
      fem.push(level);
    } else if (cat.includes("mixto")) {
      mixto.push(level);
    }
  });
  
  const parts = [];
  
  if (masc.length) {
    parts.push(`Masc: ${masc.join(", ")}`);
  }
  
  if (fem.length) {
    parts.push(`Fem: ${fem.join(", ")}`);
  }
  
  if (mixto.length) {
    parts.push(`Mixto: ${mixto.join(", ")}`);
  }
  
  return parts.join(" · ");
}

// Helper para añadir UTM tracking a URLs
function addUTMParams(url) {
  if (!url) return url;
  
  try {
    const urlObj = new URL(url);
    
    // Parámetros UTM
    urlObj.searchParams.set('utm_source', 'padelia');
    urlObj.searchParams.set('utm_medium', 'chat');
    urlObj.searchParams.set('utm_campaign', 'mvp');
    
    return urlObj.toString();
  } catch (e) {
    // Si la URL es inválida, devolver tal cual
    return url;
  }
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
      
      const isPrimary = (t === "inscribirme");
      
      a.classList.add("btn");
      a.classList.toggle("btn--primary", isPrimary);
      a.classList.toggle("btn--ghost", !isPrimary);
      
      // Añadir UTMs a la URL
      const originalUrl = a.href;
      a.href = addUTMParams(originalUrl);
      
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      
      // TRACKING - Extraer contexto del torneo
      a.addEventListener('click', () => {
        const msgBubble = a.closest('.msg--bot');
        let tournamentName = 'unknown';
        let city = 'unknown';
        
        if (msgBubble) {
          // Buscar nombre del torneo (primer <strong> del mensaje)
          const strongs = Array.from(msgBubble.querySelectorAll('strong'));
          for (const strong of strongs) {
            const text = strong.textContent.trim();
            // Evitar capturar etiquetas de metadata (¿Cuándo?, etc)
            if (!text.includes('¿') && text.length > 5) {
              tournamentName = text;
              break;
            }
          }
          
          // Buscar ciudad en metaRows
          const metaRows = msgBubble.querySelectorAll('.metaRow');
          metaRows.forEach(metaRow => {
            const label = metaRow.querySelector('.metaLabel')?.textContent || '';
            if (label.toLowerCase().includes('dónde')) {
              const whereValue = metaRow.querySelector('.metaValue')?.textContent || '';
              // Extraer ciudad: "Fuengirola Padel · fuengirola, malaga" → "fuengirola"
              const parts = whereValue.split('·');
              if (parts.length > 1) {
                city = parts[1].split(',')[0].trim();
              } else {
                city = parts[0].split(',')[0].trim();
              }
            }
          });
        }
        
        // Enviar a Google Sheets
        trackEvent({
          event_type: 'click_action',
          action: t,
          tournament_name: tournamentName,
          city: city,
          url: originalUrl,
          user_id: getUserId(),
          thread_id: getThreadId()
        });
        
        // Plausible (si existe)
        if (window.plausible) {
          plausible('Signup Click', { props: { url: originalUrl }});
        }
        
        console.log('[Analytics] Click:', t, '|', tournamentName, '|', city, '|', originalUrl);
      });
      
      row.appendChild(a);
    });

    el.textContent = "";
    el.appendChild(row);
  }
}

/**
 * Convierte filas tipo "¿Cuándo?/¿Dónde?/Categorías/Precio mínimo" en .metaRow
 */
export function enhanceMetaRows(bubble){
  if (!bubble.closest(".msg--bot")) return;

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
    if (label.length > 20) continue;
    const ln = norm(label);

    // Solo labels de torneos
    const allowed = [
      "cuándo",
      "dónde",
      "categorías",
      "categoria",
      "precio mínimo",
      "precio",
    ].some((k) => ln.includes(k));

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
    
    // 🎨 FORMATEAR SEGÚN TIPO
    if (ln.includes("cuándo")) {
      // Detectar formato: "2026-02-06 - 2026-02-08" (actual del backend)
      if (value.includes("|")) {
        const parts = value.split("|");
        if (parts.length === 2) {
          val.textContent = formatDateRange(parts[0].trim(), parts[1].trim());
        } else {
          val.textContent = formatDate(value);
        }
      } else {
        val.textContent = formatDate(value);
      }
    } else if (ln.includes("precio")) {
      // Limpiar y añadir símbolo €
      const cleanPrice = value.replace(/[^\d.,]/g, "");
      const price = parseFloat(cleanPrice);
      val.textContent = isNaN(price) ? value : `${price}€`;
    } else if (ln.includes("categor")) {
        val.textContent = formatCategories(value);
    } else {
      val.textContent = value;
    }

    row.appendChild(icon);
    row.appendChild(lab);
    row.appendChild(val);

    node.replaceWith(row);
  }
}