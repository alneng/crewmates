import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL, useSession } from "@/lib/auth-client";

export const useSocket = (sessionId: string | null) => {
  const socket = useRef<Socket | null>(null);
  const { data } = useSession();

  useEffect(() => {
    if (!sessionId || !data?.user) return;

    // Initialize socket if not already connected
    if (!socket.current) {
      socket.current = io(API_URL, {
        auth: {
          userId: data.user.id,
          name: data.user.name,
          image: data.user.image,
        },
        withCredentials: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });
    }

    const handleConnect = () => {
      if (sessionId) {
        socket.current?.emit("join-session", sessionId);
      }
    };

    socket.current.on("connect", handleConnect);
    handleConnect();

    // Cleanup function
    return () => {
      if (socket.current) {
        socket.current.off("connect", handleConnect);
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [sessionId, data?.user]);

  return socket.current;
};
