import { callApi, getApiBase } from "./lib/api.js";
import { getUserId } from "./lib/storage.js";
import { addMsg, addTyping, autoGrow, setEmptyMode } from "./lib/ui.js";

const GMAPS_KEY = "AIzaSyBkUmL-5VX4IRNO8tdNe68xaSs-OcCCaBk";

const messagesEl = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const nearMeBtn = document.getElementById("nearMeBtn");
const timeChips = document.querySelectorAll('.chip--time');
const genreChips = document.querySelectorAll('.chip--genero');
const catChips = document.querySelectorAll('.chip--cat');

let selectedTime = '';
let selectedGenre = '';
let selectedCat = '';

function updateSendState() {
  sendBtn.disabled = (input.value || "").trim().length === 0;
}

function buildQuery() {
  const parts = ['Torneos'];

  // Categoría + género → "Torneos 3ª mixtos"
  if (selectedCat && selectedGenre) {
    parts[0] = `Torneos ${selectedCat} ${selectedGenre}`;
  } else if (selectedCat) {
    parts[0] = `Torneos ${selectedCat}`;
  } else if (selectedGenre) {
    parts[0] = `Torneos ${selectedGenre}`;
  }

  const locText = nearMeBtn.classList.contains('is-active')
    ? nearMeBtn.textContent.trim()
    : '';
  if (locText) parts.push(`en ${locText}`);
  if (selectedTime) parts.push(selectedTime);

  input.value = parts.length > 1 || selectedGenre || selectedCat ? parts.join(' ') : '';
  autoGrow(input);
  updateSendState();
}

function fmtNivel(nivel) {
  return nivel ? nivel.replace(/a$/, 'ª') : '';
}

async function seed() {
  try {
    const userId = getUserId();
    const res = await fetch(`${getApiBase()}/user/${userId}/preferences`);
    const prefs = await res.json();

    const nivelText = prefs.nivel ? ` ${fmtNivel(prefs.nivel)}` : '';

    if (prefs.zona && prefs.categoria) {
      addMsg(messagesEl, "bot",
        `¡Hola! Aquí Padelia de nuevo 👋\n\n¿Seguimos buscando torneos ${prefs.categoria}${nivelText} en ${prefs.zona}?`
      );
      addQuickAction(prefs);
      return;
    }
    if (prefs.zona) {
      addMsg(messagesEl, "bot",
        `¡Hola! Aquí Padelia de nuevo 👋\n\n¿Seguimos buscando torneos${nivelText} en ${prefs.zona}?`
      );
      addQuickAction(prefs);
      return;
    }
  } catch (e) {
    console.log("No prefs found:", e);
  }

  addMsg(messagesEl, "bot",
    "Hola 👋 Soy Padelia.\n\n" +
    "Dime qué te apetece jugar y dónde, y busco torneos para ti.\n\n" +
    "Ejemplo: \u201Ceste finde cerca de Mijas, nivel 3\u201D."
  );
}

function addQuickAction(prefs) {
  const nivelText = prefs.nivel ? ` ${fmtNivel(prefs.nivel)}` : '';
  const label = prefs.categoria
    ? `Torneos ${prefs.categoria}${nivelText} en ${prefs.zona}`
    : `Torneos${nivelText} en ${prefs.zona}`;
  const bar = document.createElement('div');
  bar.className = 'quick-bar';
  bar.innerHTML = `<button class="chip--quick">${label}</button>`;
  const btn = bar.querySelector('button');
  btn.addEventListener('click', () => {
    input.value = label;
    autoGrow(input);
    updateSendState();
    form.requestSubmit();
    bar.remove();
  });
  const composer = document.querySelector('.composer');
  composer.parentNode.insertBefore(bar, composer);
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

// =====================
// QUICK FILTERS
// =====================

nearMeBtn.addEventListener('click', async () => {
  nearMeBtn.textContent = 'Localizando...';
  nearMeBtn.disabled = true;

  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 8000,
        maximumAge: 300000,
      });
    });

    const { latitude, longitude } = pos.coords;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=es&key=${GMAPS_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    let city = '';
    if (data.results && data.results.length > 0) {
      const comp = data.results[0].address_components || [];
      const loc = comp.find(c => c.types.includes('locality'));
      city = loc ? loc.long_name : data.results[0].formatted_address.split(',')[0];
    }

    if (city) {
      nearMeBtn.textContent = city;
      nearMeBtn.classList.add('is-active');
    } else {
      nearMeBtn.textContent = 'Cerca de mí';
    }
  } catch (err) {
    console.error('Geolocation error:', err);
    nearMeBtn.textContent = 'Cerca de mí';
  }

  nearMeBtn.disabled = false;
  buildQuery();
});

timeChips.forEach(chip => {
  chip.addEventListener('click', () => {
    if (chip.classList.contains('is-active')) {
      chip.classList.remove('is-active');
      selectedTime = '';
    } else {
      timeChips.forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      selectedTime = chip.dataset.value;
    }
    buildQuery();
  });
});

catChips.forEach(chip => {
  chip.addEventListener('click', () => {
    if (chip.classList.contains('is-active')) {
      chip.classList.remove('is-active');
      selectedCat = '';
    } else {
      catChips.forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      selectedCat = chip.dataset.value;
    }
    buildQuery();
  });
});

genreChips.forEach(chip => {
  chip.addEventListener('click', () => {
    if (chip.classList.contains('is-active')) {
      chip.classList.remove('is-active');
      selectedGenre = '';
    } else {
      genreChips.forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      selectedGenre = chip.dataset.value;
    }
    buildQuery();
  });
});

// =====================
// INIT
// =====================

seed().then(() => hydrateFromQuery());

requestAnimationFrame(() => {
  messagesEl.scrollTop = 0;
});

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
    // Clear all active chips after response
    document.querySelectorAll('.is-active').forEach(c => c.classList.remove('is-active'));
    selectedTime = '';
    selectedGenre = '';
    selectedCat = '';
  } catch (err) {
    typing.remove();
    addMsg(messagesEl, "bot",
      "Vaya, no he podido buscar torneos ahora mismo. Inténtalo de nuevo en unos segundos 🙏"
    );
    console.error(err);
  }
});