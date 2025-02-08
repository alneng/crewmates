import { createAuthClient } from "better-auth/react";

export const API_URL = import.meta.env.VITE_API_URL; // API URL
export const BASE_URL = import.meta.env.VITE_BASE_URL; // App Base URL

export const authClient = createAuthClient({
  baseURL: API_URL,
});

export const { signIn, signOut, signUp, useSession } = authClient;

export const handleSignOut = () => {
  signOut({
    fetchOptions: {
      onSuccess: () => {
        window.location.href = "/auth";
      },
    },
  });
};
