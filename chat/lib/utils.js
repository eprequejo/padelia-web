// chat/lib/utils.js

/**
 * Formatea fecha ISO a español legible
 * @param {string} dateStr - "2026-02-06"
 * @returns {string} - "Jue 6 Feb"
 */
export function formatDate(dateStr) {
  if (!dateStr) return "";
  
  try {
    const date = new Date(dateStr + "T00:00:00");
    
    const weekday = date.toLocaleDateString("es-ES", { weekday: "short" });
    const day = date.getDate();
    const month = date.toLocaleDateString("es-ES", { month: "short" });
    
    // Capitalizar primera letra
    const weekdayCapitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    
    return `${weekdayCapitalized} ${day} ${month}`;
  } catch (e) {
    return dateStr; // Fallback
  }
}

/**
 * Formatea rango de fechas
 * @param {string} start - "2026-02-06"
 * @param {string} end - "2026-02-08"
 * @returns {string} - "Jue 6 - Sáb 8 Feb"
 */
export function formatDateRange(start, end) {
  if (!start) return "";
  if (!end || start === end) return formatDate(start);
  
  try {
    const startDate = new Date(start + "T00:00:00");
    const endDate = new Date(end + "T00:00:00");
    
    const startWeekday = startDate.toLocaleDateString("es-ES", { weekday: "short" });
    const startDay = startDate.getDate();
    
    const endWeekday = endDate.toLocaleDateString("es-ES", { weekday: "short" });
    const endDay = endDate.getDate();
    const endMonth = endDate.toLocaleDateString("es-ES", { month: "short" });
    
    const startCapitalized = startWeekday.charAt(0).toUpperCase() + startWeekday.slice(1);
    const endCapitalized = endWeekday.charAt(0).toUpperCase() + endWeekday.slice(1);
    
    // Mismo mes
    if (startDate.getMonth() === endDate.getMonth()) {
      return `${startCapitalized} ${startDay} - ${endCapitalized} ${endDay} ${endMonth}`;
    }
    
    // Meses diferentes
    const startMonth = startDate.toLocaleDateString("es-ES", { month: "short" });
    return `${startCapitalized} ${startDay} ${startMonth} - ${endCapitalized} ${endDay} ${endMonth}`;
    
  } catch (e) {
    return `${start} - ${end}`; // Fallback
  }
}