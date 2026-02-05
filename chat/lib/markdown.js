// chat/lib/markdown.js

import { trackEvent } from "./analytics.js";
import { getUserId, getThreadId } from "./storage.js";

const norm = (s) => (s || "").trim().toLowerCase();

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
    
    // 2. Estilizar y mover botones a actionsRow
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
      
      // Tracking
      a.addEventListener('click', () => {
        trackEvent({
          event_type: 'click_action',
          action: t,
          tournament_name: strong ? strong.textContent : 'unknown',
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
    
    p.after(row);
    
    // 3. Limpiar párrafo - queda solo detalles
    p.innerHTML = p.innerHTML.replace(/\s*·\s*$/g, '').replace(/^\s*·\s*/g, '').trim();
    
    if (p.textContent.trim()) {
      p.className = "tournament-details";
    } else {
      p.remove();
    }
  });
}

export function enhanceMetaRows(bubble) {
  // No-op
}