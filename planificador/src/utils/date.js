export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit' }).format(date);
};

export const getDayOfWeek = (dateString) => {
  if (!dateString) return '';
  const days = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  return days[new Date(dateString).getDay()];
};

export const formatTime = (timeString) => {
  if (!timeString) return '';
  // Si el formato es HH:MM:SS, quitamos los segundos
  // Si es HH:MM, lo dejamos tal cual
  const parts = timeString.split(':');
  return `${parts[0]}:${parts[1]}`;
};

// Obtener fecha actual en YYYY-MM-DD
export const getTodayStr = () => new Date().toISOString().split('T')[0];

// Sumar días a una fecha
export const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};