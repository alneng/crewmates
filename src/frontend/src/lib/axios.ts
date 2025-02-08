import axios from "axios";
import { API_URL } from "./auth-client";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

export default api;

export const mapbox = axios.create({
  baseURL: "https://api.mapbox.com",
});

mapbox.interceptors.request.use((config) => {
  config.params = {
    ...config.params,
    access_token: import.meta.env.VITE_MAPBOX_TOKEN,
  };
  return config;
});
