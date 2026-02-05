import { enhanceActionButtons, enhanceMetaRows } from "./markdown.js";

export function autoGrow(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 140) + "px";
}

export function setEmptyMode(isEmpty) {
  document.body.classList.toggle("chat--empty", isEmpty);
}

export function hasAnyMessage(messagesEl) {
  return messagesEl.querySelector(".msgRow") !== null;
}

export function addMsg(messagesEl, role, text) {
  const wrap = document.createElement("div");
  wrap.className = "msgRow " + (role === "user" ? "msgRow--user" : "msgRow--bot");
  
  const bubble = document.createElement("div");
  bubble.className = "msg " + (role === "user" ? "msg--user" : "msg--bot");
  bubble.innerHTML = marked.parse(text);
  
  // PRIMERO: Procesar metaRows y botones
  enhanceMetaRows(bubble);
  enhanceActionButtons(bubble);
  
  // DESPUÉS: Procesar torneos (ahora los botones ya existen)
  if (role === "bot") {
    addTournamentSeparators(bubble);
    makeTournamentNamesClickable(bubble);
  }
  
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  setEmptyMode(!hasAnyMessage(messagesEl));
}

function addTournamentSeparators(bubble) {
  const titles = Array.from(bubble.querySelectorAll('strong, h2, h3'));
  
  let tournamentTitles = [];
  
  titles.forEach(title => {
    const text = title.textContent.trim();
    
    if (text.includes('¿') || text.length < 10) return;
    if (text.toLowerCase().includes('hola') || text.toLowerCase().includes('padelia')) return;
    if (text.toLowerCase().includes('torneos:')) return;
    
    tournamentTitles.push(title);
  });
  
  tournamentTitles.forEach((title, index) => {
    if (index > 0) {
      const separator = document.createElement('hr');
      separator.className = 'tournament-separator';
      title.before(separator);
    }
  });
}

function makeTournamentNamesClickable(bubble) {
  const strongs = Array.from(bubble.querySelectorAll('strong'));
  
  strongs.forEach(strong => {
    const text = strong.textContent.trim();
    
    // Filtrar no-títulos
    if (text.length < 10) return;
    if (text.includes('¿')) return;
    if (text.toLowerCase().includes('hola')) return;
    if (text.toLowerCase().includes('torneos:')) return;
    
    // Buscar actionsRow en los siguientes elementos
    let el = strong.closest('p');
    if (!el) return;
    
    let inscribirmeUrl = null;
    let attempts = 0;
    
    while (el.nextElementSibling && attempts < 5) {
      el = el.nextElementSibling;
      const actionsRow = el.classList.contains('actionsRow') ? el : el.querySelector('.actionsRow');
      if (actionsRow) {
        const primaryBtn = actionsRow.querySelector('.btn--primary');
        if (primaryBtn) {
          inscribirmeUrl = primaryBtn.href;
          break;
        }
      }
      attempts++;
    }
    
    if (!inscribirmeUrl) return;
    
    // Hacer clickeable
    const parent = strong.closest('p');
    parent.classList.add('tournament-name');
    
    const link = document.createElement('a');
    link.href = inscribirmeUrl;
    link.className = 'tournament-title-link';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = text;
    
    strong.textContent = '';
    strong.appendChild(link);
  });
}

export function addTyping(messagesEl) {
  const typing = document.createElement("div");
  typing.className = "msgRow msgRow--bot";
  typing.innerHTML = `
    <div class="msg msg--bot msg--typing">
      <span class="dots"><i></i><i></i><i></i></span>
    </div>
  `;
  messagesEl.appendChild(typing);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return typing;
}