export const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:4043/api'
  : `https://${window.location.hostname}:4043/api`;
