// chat/lib/ui.js

import { renderResponse, attachTracking } from "./markdown.js";

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
  
  if (role === "bot") {
    const html = renderResponse(text);
    if (html) {
      bubble.innerHTML = html;
      attachTracking(bubble);
    } else {
      bubble.innerHTML = `<p>${text}</p>`;
    }
  } else {
    bubble.innerHTML = `<p>${text}</p>`;
  }
  
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  setEmptyMode(!hasAnyMessage(messagesEl));
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