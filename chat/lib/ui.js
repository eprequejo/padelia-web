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
    console.log('[DEBUG] Processing tournament enhancements...');
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
  console.log('[DEBUG] Found titles:', titles.length);
  
  let tournamentTitles = [];
  
  titles.forEach(title => {
    const text = title.textContent.trim();
    console.log('[DEBUG] Title text:', text);
    
    if (text.includes('¿') || text.length < 10) return;
    if (text.toLowerCase().includes('hola') || text.toLowerCase().includes('padelia')) return;
    if (text.toLowerCase().includes('torneos:')) return;
    
    tournamentTitles.push(title);
  });
  
  console.log('[DEBUG] Tournament titles:', tournamentTitles.length);
  
  tournamentTitles.forEach((title, index) => {
    if (index > 0) {
      const separator = document.createElement('hr');
      separator.className = 'tournament-separator';
      title.before(separator);
      console.log('[DEBUG] Added separator before:', title.textContent);
    }
  });
}

function makeTournamentNamesClickable(bubble) {
  const titles = Array.from(bubble.querySelectorAll('strong, h2, h3'));
  
  titles.forEach(title => {
    const text = title.textContent.trim();
    
    if (text.includes('¿') || text.length < 10) return;
    if (text.toLowerCase().includes('hola') || text.toLowerCase().includes('padelia')) return;
    if (text.toLowerCase().includes('torneos:')) return;
    
    console.log('[DEBUG] Processing title:', text);
    
    // Buscar el siguiente <ul> que contenga actionsRow
    let current = title.closest('p');
    if (!current) {
      console.log('[DEBUG] Title not in <p> tag');
      return;
    }
    
    // Buscar siguiente elemento UL
    let nextUl = current.nextElementSibling;
    let attempts = 0;
    
    while (nextUl && attempts < 10) {
      console.log('[DEBUG] Checking next:', nextUl.tagName);
      
      if (nextUl.tagName === 'UL') {
        // Buscar actionsRow dentro de este UL
        const actionsRow = nextUl.querySelector('.actionsRow');
        
        if (actionsRow) {
          console.log('[DEBUG] Found actionsRow in UL');
          const primaryBtn = actionsRow.querySelector('.btn--primary');
          
          if (primaryBtn) {
            const inscribirmeUrl = primaryBtn.href;
            console.log('[DEBUG] Found URL:', inscribirmeUrl);
            
            // Hacer título clickeable
            title.classList.add('tournament-name');
            
            const link = document.createElement('a');
            link.href = inscribirmeUrl;
            link.className = 'tournament-title-link';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = text;
            
            title.textContent = '';
            title.appendChild(link);
            
            console.log('[DEBUG] Made title clickable:', text);
            return;
          }
        }
      }
      
      nextUl = nextUl.nextElementSibling;
      attempts++;
    }
    
    console.log('[DEBUG] No URL found for:', text);
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