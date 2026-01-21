// Configuración de API centralizada
const API_CONFIG = {
  // Para desarrollo local (navegador web)
  DEV_BASE_URL: 'http://localhost:3000',

  // Para dispositivos móviles - IP local
  MOBILE_BASE_URL: 'http://192.168.1.27:3000',

  // Para producción - URL de Render (actualizar cuando tengas la URL)
  PRODUCTION_BASE_URL: 'https://tu-app-render.onrender.com',

  // Obtener la URL base correcta
  getBaseUrl: () => {
    // Si estamos en producción (URL de Render definida y válida)
    if (API_CONFIG.PRODUCTION_BASE_URL !== 'https://tu-app-render.onrender.com') {
      console.log('🚀 Usando servidor de producción en Render');
      return API_CONFIG.PRODUCTION_BASE_URL;
    }

    // Si no es un navegador web normal, usar IP de red local
    const isWebBrowser = window.location.protocol === 'http:' || window.location.protocol === 'https:';

    if (!isWebBrowser) {
      // Estamos en una app empaquetada (Capacitor)
      console.log('🔧 Usando IP de red para app móvil');
      return API_CONFIG.MOBILE_BASE_URL;
    }

    // Estamos en navegador web normal
    console.log('🌐 Usando localhost para navegador web');
    return API_CONFIG.DEV_BASE_URL;
  }
};

export default API_CONFIG;
