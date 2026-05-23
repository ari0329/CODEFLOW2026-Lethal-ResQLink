const config = {
  API_URL:    process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000',
  SOCKET_URL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000',
  AI_URL:     process.env.REACT_APP_AI_URL      || 'http://localhost:8000',
  MAP_CENTER: [20.5937, 78.9629],   // India center
  MAP_ZOOM:   5,
};
export default config;