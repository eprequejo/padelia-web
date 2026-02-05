import { enhanceActionButtons, enhanceMetaRows } from "./markdown.js";

// Configurar marked para respetar saltos de línea
marked.setOptions({ breaks: true });

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
  
  enhanceMetaRows(bubble);
  enhanceActionButtons(bubble);
  
  if (role === "bot") {
    addTournamentSeparators(bubble);
  }
  
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  setEmptyMode(!hasAnyMessage(messagesEl));
}

function addTournamentSeparators(bubble) {
  const titles = Array.from(bubble.querySelectorAll('.tournament-name'));
  
  titles.forEach((title, index) => {
    if (index > 0) {
      const separator = document.createElement('hr');
      separator.className = 'tournament-separator';
      title.before(separator);
    }
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