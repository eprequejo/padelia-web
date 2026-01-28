import { getUserId, getThreadId } from "./storage.js";

export function getApiBase() {
  const isLocal = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  return isLocal ? "http://127.0.0.1:8000" : "https://TU-CLOUD-RUN-URL";
}

export async function callApi(message) {
  const API_BASE = getApiBase();
  const payload = { user_id: getUserId(), thread_id: getThreadId(), message };

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
