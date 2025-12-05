// Configuración de zona horaria para El Salvador
// UTC-6 = restar 6 horas = restar 21600 segundos
const TIMEZONE_OFFSET_SECONDS = 21600; // 6 horas * 3600 segundos

// Función para obtener fecha/hora actual en zona local (El Salvador)
const getLocalDateTime = () => {
  const now = new Date();
  // Crear fecha ajustada a zona local
  const localDate = new Date(now.getTime() - (TIMEZONE_OFFSET_SECONDS * 1000));
  return localDate.toISOString();
};

// Función para obtener solo la fecha actual en El Salvador (YYYY-MM-DD)
const getLocalDate = () => {
  return getLocalDateTime().split('T')[0];
};

module.exports = {
  TIMEZONE_OFFSET_SECONDS,
  getLocalDateTime,
  getLocalDate
};