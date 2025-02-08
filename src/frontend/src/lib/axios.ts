import axios, { AxiosError, AxiosInstance } from "axios";
import { handleSignOut } from "./auth-client";

export const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: `${import.meta.env.VITE_PUBLIC_APP_URL}/api`,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });

  // Handle StaleTokenException
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response) {
        const errorData = error.response.data as { message?: string };

        if (
          errorData.message?.includes("Token is stale") ||
          error.response.status === 303
        ) {
          handleSignOut();
          return Promise.reject(new Error("Session expired. Signing out..."));
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export const api = createAxiosInstance();
