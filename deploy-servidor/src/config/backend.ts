// Central backend base URL used by the frontend.
// If VITE_BACKEND_URL is not defined, default to empty string so requests are made to the same origin
// (the frontend nginx will proxy /api to the backend service inside Docker).
export const API_BASE = import.meta.env.VITE_BACKEND_URL || '';
