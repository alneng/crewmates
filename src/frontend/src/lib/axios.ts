import axios from "axios";
import { API_URL } from "./auth-client";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

export default api;
