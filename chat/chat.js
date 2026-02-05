import { callApi } from "./lib/api.js";
import { addMsg, addTyping, autoGrow, setEmptyMode } from "./lib/ui.js";

const messagesEl = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");

function updateSendState() {
  sendBtn.disabled = (input.value || "").trim().length === 0;
}

function seed() {
  addMsg(messagesEl, "bot",
    "Hola 👋 Soy Padelia.\n\n" +
    "Dime qué te apetece jugar y dónde, y busco torneos para ti.\n\n" +
    "Ejemplos: “este finde cerca de Mijas, nivel 3” · “mixto por Málaga en febrero”."
  );
}

function hydrateFromQuery() {
  const url = new URL(window.location.href);
  const q = (url.searchParams.get("q") || "").trim();
  if (q) {
    input.value = q;
    autoGrow(input);
    updateSendState();
    setTimeout(() => form.requestSubmit(), 60);
  }
}

// Init
setEmptyMode(true);
seed();
hydrateFromQuery();
input.focus();
autoGrow(input);
updateSendState();

input.addEventListener("input", () => {
  autoGrow(input);
  updateSendState();
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) form.requestSubmit();
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = (input.value || "").trim();
  if (!text) return;

  addMsg(messagesEl, "user", text);
  input.value = "";
  autoGrow(input);
  updateSendState();
  input.focus();

  const typing = addTyping(messagesEl);

  try {
    const data = await callApi(text);
    console.log("API response:", data);
    
    typing.remove();
    addMsg(messagesEl, "bot", data.answer || "No he podido generar respuesta.");
    
    } catch (err) {
    typing.remove();
    addMsg(messagesEl, "bot",
        "Vaya, no he podido buscar torneos ahora mismo. Inténtalo de nuevo en unos segundos 🙏"
    );
    console.error(err);
    }

});