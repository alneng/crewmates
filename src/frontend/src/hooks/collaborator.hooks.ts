import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";

interface Collaborator {
  userId: string;
  cursor?: { latitude: number; longitude: number };
}

export const useCollaborators = (socket: Socket | null) => {
  const [collaborators, setCollaborators] = useState<Map<string, Collaborator>>(
    new Map()
  );

  useEffect(() => {
    if (!socket) return;

    socket.on("user-joined", ({ userId }) => {
      setCollaborators((prev) => new Map(prev).set(userId, { userId }));
    });

    socket.on("user-left", ({ userId }) => {
      setCollaborators((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    });

    socket.on("cursor-update", ({ userId, latitude, longitude }) => {
      setCollaborators((prev) => {
        const next = new Map(prev);
        const user = next.get(userId);
        if (user) {
          next.set(userId, { ...user, cursor: { latitude, longitude } });
        }
        return next;
      });
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("cursor-update");
    };
  }, [socket]);

  return collaborators;
};
