import { getUserId, getThreadId } from "./storage.js";

export function getApiBase() {
  const isLocal = (window.location.hostname === "localhost" || 
                   window.location.hostname === "127.0.0.1");

  if (isLocal) console.log("Usando API local");
  return isLocal 
    ? "http://127.0.0.1:8000" 
    : "https://padelia-api-725054882352.europe-west4.run.app";
  // Por ahora siempre usamos el API desplegado en Cloud Run
  // return "https://padelia-api-725054882352.europe-west4.run.app";
}

export async function callApi(message) {
  const API_BASE = getApiBase();
  const payload = { 
    user_id: getUserId(), 
    thread_id: getThreadId(), 
    message 
  };
  
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${txt || "error"}`);
  }
  
  return await res.json();
}