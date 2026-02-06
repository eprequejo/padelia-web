// chat/lib/markdown.js

import { trackEvent } from "./analytics.js";
import { getUserId, getThreadId } from "./storage.js";
import { parseResponse } from "./parser.js";

// =====================
// HELPERS
// =====================

function buildUbicacion(t) {
  const parts = [t.club];
  if (t.ciudad) parts.push(t.ciudad);
  if (t.provincia && t.provincia.toLowerCase() !== (t.ciudad || '').toLowerCase()) {
    parts.push(t.provincia);
  }
  return parts.filter(Boolean).join(', ');
}

function addUTMParams(url) {
  if (!url) return url;
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('utm_source', 'padelia');
    urlObj.searchParams.set('utm_medium', 'chat');
    urlObj.searchParams.set('utm_campaign', 'mvp');
    return urlObj.toString();
  } catch (e) {
    return url;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr + "T00:00:00");
    const day = date.getDate();
    const month = date.toLocaleDateString("es-ES", { month: "short" });
    return `${day} ${month}`;
  } catch (e) {
    return dateStr;
  }
}

function formatDateRange(start, end) {
  if (!start) return "";
  if (!end || start === end) return formatDate(start);
  try {
    const s = new Date(start + "T00:00:00");
    const e = new Date(end + "T00:00:00");
    const sDay = s.getDate();
    const eDay = e.getDate();
    const eMonth = e.toLocaleDateString("es-ES", { month: "short" });
    if (s.getMonth() === e.getMonth()) {
      return `${sDay}-${eDay} ${eMonth}`;
    }
    const sMonth = s.toLocaleDateString("es-ES", { month: "short" });
    return `${sDay} ${sMonth} - ${eDay} ${eMonth}`;
  } catch (e) {
    return `${start} - ${end}`;
  }
}

function formatCategories(str) {
  if (!str) return "";
  const cats = str.toLowerCase().split(",").map(c => c.trim());
  const masc = [], fem = [], mixto = [], otros = [];
  
  cats.forEach(cat => {
    // Patrón numérico: "2 masculina", "3a femenina"
    const matchNum = cat.match(/(\d+[ab]?)/i);
    // Patrón letra: "nivel a", "categoria b"
    const matchLetter = cat.match(/(?:nivel|categoria)\s*([a-c])/i);
    
    const level = matchNum ? matchNum[1].toUpperCase() 
                 : matchLetter ? matchLetter[1].toUpperCase() 
                 : null;
    
    if (!level) return;
    
    if (cat.includes("masculin")) masc.push(level);
    else if (cat.includes("femenin")) fem.push(level);
    else if (cat.includes("mixto") || cat.includes("mixta")) mixto.push(level);
    else otros.push(level);
  });
  
  const parts = [];
  if (masc.length) parts.push(`Masc.: ${masc.join(",")}`);
  if (fem.length) parts.push(`Fem.: ${fem.join(",")}`);
  if (mixto.length) parts.push(`Mix.: ${mixto.join(",")}`);
  if (otros.length) parts.push(otros.join(","));
  return parts.join(" ");
}

// =====================
// RENDERER
// =====================

export function renderResponse(text) {
  const { intro, torneos, cierre } = parseResponse(text);
  
  // Si no hay torneos, devolver null para fallback
  if (torneos.length === 0 && !intro && !cierre) {
    return null;
  }
  
  let html = '';
  
  if (intro) {
    html += `<p>${intro}</p>`;
  }
  
  torneos.forEach((t, i) => {
    if (i > 0) html += `<hr class="tournament-separator">`;
    
    const fecha = formatDateRange(t.fecha_inicio, t.fecha_fin);
    const ubicacion = buildUbicacion(t);
    const precio = t.precio ? `${t.precio}€` : '';
    const cats = formatCategories(t.categorías);
    
    const detalles = [
        fecha ? `🗓️ ${fecha}` : '',
        ubicacion ? `📍 ${ubicacion}` : '',
        precio ? `💰 ${precio}` : ''
        ].filter(Boolean).join(' · ');

    const urlInscripcion = addUTMParams(t.url_inscripcion);
    const urlInfo = addUTMParams(t.url_info);
    
    html += `
      <p class="tournament-name">
        <a href="${urlInscripcion}" class="tournament-title-link" target="_blank" rel="noopener noreferrer">
          <strong>${t.nombre}</strong>
        </a>
      </p>
      <p class="tournament-details">${detalles}</p>
      <div class="actionsRow">
        <a href="${urlInscripcion}" class="btn btn--primary" target="_blank" rel="noopener noreferrer" data-tournament="${t.nombre}">Inscribirme</a>
        <a href="${urlInfo}" class="btn btn--ghost" target="_blank" rel="noopener noreferrer" data-tournament="${t.nombre}">Más info</a>
      </div>
    `;
  });
  
  if (cierre) {
    html += `<p>${cierre}</p>`;
  }
  
  return html;
}

// =====================
// TRACKING
// =====================

export function attachTracking(bubble) {
  bubble.querySelectorAll('.actionsRow .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      trackEvent({
        event_type: 'click_action',
        action: btn.classList.contains('btn--primary') ? 'inscribirme' : 'más info',
        tournament_name: btn.dataset.tournament || 'unknown',
        url: btn.href,
        user_id: getUserId(),
        thread_id: getThreadId()
      });
      if (window.plausible) {
        plausible('Signup Click', { props: { url: btn.href }});
      }
    });
  });
}