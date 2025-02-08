import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL, useSession } from "@/lib/auth-client";

export const useSocket = (sessionId: string | null) => {
  const socket = useRef<Socket | null>(null);
  const { data } = useSession();

  useEffect(() => {
    if (!sessionId || !data) return;

    socket.current = io(API_URL, {
      auth: { userId: data.user.id },
    });

    socket.current.emit("join-session", sessionId);

    return () => {
      socket.current?.disconnect();
    };
  }, [data, sessionId]);

  return socket.current;
};
