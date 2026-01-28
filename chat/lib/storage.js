const mkId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

export function getThreadId() {
  const key = "padelia_thread_id";
  let tid = localStorage.getItem(key);
  if (!tid) { tid = mkId(); localStorage.setItem(key, tid); }
  return tid;
}

export function getUserId() {
  const key = "padelia_user_id";
  let uid = localStorage.getItem(key);
  if (!uid) { uid = mkId(); localStorage.setItem(key, uid); }
  return uid;
}
