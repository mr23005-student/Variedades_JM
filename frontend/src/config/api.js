// Configuración de API centralizada
const API_CONFIG = {
  // Para desarrollo local (navegador web)
  DEV_BASE_URL: 'http://localhost:3000',

  // Para dispositivos móviles - IP local
  MOBILE_BASE_URL: 'http://192.168.1.27:3000',

  // Para producción - URL de Render
  PRODUCTION_BASE_URL: 'https://variedades-jm.onrender.com',

  // Obtener la URL base correcta
  getBaseUrl: () => {
    // FORZAR SIEMPRE RENDER para apps compiladas con Capacitor
    console.log('🚀 FORZANDO servidor de producción en Render');
    console.log('🌍 URL: https://variedades-jm.onrender.com');
    return 'https://variedades-jm.onrender.com';
  }
};

// Helper function para obtener la URL completa de la API
export function getApiUrl(endpoint) {
  const baseUrl = API_CONFIG.getBaseUrl();
  // Asegurar que el endpoint empiece con /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

export default API_CONFIG;
