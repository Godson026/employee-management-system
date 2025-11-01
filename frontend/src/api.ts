import axios from 'axios';

// Get the backend URL from environment variables
// Vite exposes env variables prefixed with VITE_ on the import.meta.env object
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
});

export default api;
