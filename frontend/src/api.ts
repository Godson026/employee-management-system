import axios from 'axios';

// Get the backend URL from environment variables
// Vite exposes env variables prefixed with VITE_ on the import.meta.env object
let API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

// Ensure the URL has a protocol (http:// or https://)
// If it doesn't start with http:// or https://, prepend https://
if (API_URL && !API_URL.match(/^https?:\/\//i)) {
  // If it starts with //, add https:
  if (API_URL.startsWith('//')) {
    API_URL = `https:${API_URL}`;
  } else {
    // Otherwise, prepend https://
    API_URL = `https://${API_URL}`;
  }
}

// Remove trailing slash if present
API_URL = API_URL.replace(/\/$/, '');

const api = axios.create({
  baseURL: API_URL,
});

// Log the API URL (useful for debugging in production too)
console.log('🌐 API Base URL configured:', API_URL);
console.log('📝 Raw VITE_API_URL env:', (import.meta as any).env?.VITE_API_URL || '(not set)');

export default api;
