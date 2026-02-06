// chat/lib/parser.js

/**
 * Parsea la respuesta estructurada del API
 */
export function parseResponse(text) {
  const introMatch = text.match(/\[INTRO\]([\s\S]*?)\[\/INTRO\]/);
  const cierreMatch = text.match(/\[CIERRE\]([\s\S]*?)\[\/CIERRE\]/);
  const torneoMatches = [...text.matchAll(/\[TORNEO\]([\s\S]*?)\[\/TORNEO\]/g)];
  
  const intro = introMatch ? introMatch[1].trim() : '';
  const cierre = cierreMatch ? cierreMatch[1].trim() : '';
  
  const torneos = torneoMatches.map(match => {
    const content = match[1].trim();
    const torneo = {};
    content.split('\n').forEach(line => {
      const idx = line.indexOf(':');
      if (idx > 0) {
        const key = line.substring(0, idx).trim();
        const value = line.substring(idx + 1).trim();
        torneo[key] = value;
      }
    });
    return torneo;
  });
  
  return { intro, torneos, cierre };
}