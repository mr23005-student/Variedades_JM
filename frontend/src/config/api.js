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
    // FORZAR SIEMPRE el servidor de producción para apps móviles
    const isWebBrowser = window.location.protocol === 'http:' || window.location.protocol === 'https:';

    if (!isWebBrowser) {
      // Estamos en una app empaquetada (Capacitor) - USAR RENDER
      console.log('🚀 App móvil - Usando servidor de producción en Render');
      return API_CONFIG.PRODUCTION_BASE_URL;
    }

    // Estamos en navegador web normal
    console.log('🌐 Usando localhost para navegador web');
    return API_CONFIG.DEV_BASE_URL;
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
