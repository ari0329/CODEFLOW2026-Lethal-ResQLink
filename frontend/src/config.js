const config = {
  API_URL:    import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000',
  WS_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000',
  AI_URL:     import.meta.env.VITE_AI_URL      || 'http://localhost:8000',
  MAP_CENTER: [20.5937, 78.9629],
  MAP_ZOOM:   5,
};
export default config;