// PRUEBA TEMPORAL - Usar HTTP para diagnosticar
const API_CONFIG = {
  getBaseUrl: () => 'http://variedades-jm.onrender.com'
};

export function getApiUrl(endpoint) {
  const baseUrl = 'http://variedades-jm.onrender.com';
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

export default API_CONFIG;
