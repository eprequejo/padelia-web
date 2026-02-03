// chat/lib/analytics.js

const ANALYTICS_URL = 'https://script.google.com/macros/s/AKfycbwRvTKRflCZ21qdjSJQb-fLl6QdnCqAbCjzWyNMpt7vVEqN7vx1Q-8RiRJ4Eh1fPhnl/exec';

export async function trackEvent(data) {
  try {
    // Enviar evento a Google Sheets
    await fetch(ANALYTICS_URL, {
      method: 'POST',
      mode: 'no-cors', // Importante: Google Apps Script requiere esto
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    console.log('[Analytics] Event tracked:', data.action);
  } catch (error) {
    // No bloquear la UX si falla
    console.debug('[Analytics] Error:', error);
  }
}