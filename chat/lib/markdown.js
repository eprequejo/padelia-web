// chat/lib/markdown.js

import { trackEvent } from "./analytics.js";
import { getUserId, getThreadId } from "./storage.js";

const norm = (s) => (s || "").trim().toLowerCase();

// Helper para añadir UTM tracking a URLs
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

// Formatear fechas ISO en texto de detalles
function formatDatesInText(text) {
  // Patrón rango: YYYY-MM-DD - YYYY-MM-DD
  text = text.replace(/(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})/g, (match, start, end) => {
    return formatDateRange(start, end);
  });
  
  // Patrón fecha simple: YYYY-MM-DD
  text = text.replace(/(\d{4}-\d{2}-\d{2})/g, (match) => {
    return formatDate(match);
  });
  
  return text;
}

/**
 * Procesa botones y estructura torneos en: título / detalles / botones
 */
export function enhanceActionButtons(bubble) {
  const paragraphs = Array.from(bubble.querySelectorAll("p"));
  
  paragraphs.forEach(p => {
    const btns = Array.from(p.querySelectorAll("a")).filter(a => {
      const t = norm(a.textContent);
      return t === "inscribirme" || t === "más info" || t === "mas info";
    });
    
    if (btns.length === 0) return;
    
    const strong = p.querySelector("strong");
    const primaryBtn = btns.find(b => norm(b.textContent) === "inscribirme");
    const inscribirmeUrl = primaryBtn ? primaryBtn.href : null;
    const tournamentName = strong ? strong.textContent : 'unknown';
    
    // 1. Extraer título si existe
    if (strong && strong.textContent.length > 10) {
      const titleP = document.createElement("p");
      titleP.className = "tournament-name";
      
      if (inscribirmeUrl) {
        const link = document.createElement("a");
        link.href = addUTMParams(inscribirmeUrl);
        link.className = "tournament-title-link";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.innerHTML = `<strong>${strong.textContent}</strong>`;
        titleP.appendChild(link);
      } else {
        titleP.appendChild(strong.cloneNode(true));
      }
      
      p.before(titleP);
      strong.remove();
    }
    
    // 2. Crear actionsRow con botones
    const row = document.createElement("div");
    row.className = "actionsRow";
    
    btns.forEach(a => {
      const t = norm(a.textContent);
      const isInscribirme = t === "inscribirme";
      
      a.classList.add("btn");
      a.classList.toggle("btn--primary", isInscribirme);
      a.classList.toggle("btn--ghost", !isInscribirme);
      
      const originalUrl = a.href;
      a.href = addUTMParams(originalUrl);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      
      a.addEventListener('click', () => {
        trackEvent({
          event_type: 'click_action',
          action: t,
          tournament_name: tournamentName,
          url: originalUrl,
          user_id: getUserId(),
          thread_id: getThreadId()
        });
        if (window.plausible) {
          plausible('Signup Click', { props: { url: originalUrl }});
        }
      });
      
      row.appendChild(a);
    });
    
    // 3. Separar detalles por <br>
    p.innerHTML = p.innerHTML
      .replace(/\s*·\s*(<br\s*\/?>|$)/gi, '$1')
      .replace(/^\s*·\s*/g, '')
      .trim();
    
    const parts = p.innerHTML
      .split(/<br\s*\/?>/gi)
      .map(s => s.trim())
      .filter(Boolean);
    
    if (parts.length > 0) {
      const fragment = document.createDocumentFragment();
      parts.forEach(part => {
        const detailP = document.createElement("p");
        detailP.className = "tournament-details";
        detailP.innerHTML = formatDatesInText(part);
        fragment.appendChild(detailP);
      });
      fragment.appendChild(row);
      p.replaceWith(fragment);
    } else {
      p.after(row);
      p.remove();
    }
  });
}

/**
 * No-op - el nuevo formato no usa metaRows
 */
export function enhanceMetaRows(bubble) {
  // Ya no se usa
}