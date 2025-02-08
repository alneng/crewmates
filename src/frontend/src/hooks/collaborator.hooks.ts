import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";

interface Collaborator {
  userId: string;
  name: string;
  cursor?: { latitude: number; longitude: number };
}

export const useCollaborators = (socket: Socket | null) => {
  const [collaborators, setCollaborators] = useState<Map<string, Collaborator>>(
    new Map()
  );

  useEffect(() => {
    if (!socket) return;

    const handleUserJoined = ({
      userId,
      name,
    }: {
      userId: string;
      name: string;
    }) => {
      setCollaborators((prev) => {
        const next = new Map(prev);
        next.set(userId, { userId, name });
        return next;
      });
    };

    const handleUserLeft = ({ userId }: { userId: string; name: string }) => {
      setCollaborators((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    };

    const handleCursorUpdate = ({
      userId,
      name,
      latitude,
      longitude,
    }: {
      userId: string;
      name: string;
      latitude: number;
      longitude: number;
    }) => {
      setCollaborators((prev) => {
        const next = new Map(prev);
        const user = next.get(userId);
        if (user) {
          next.set(userId, { ...user, cursor: { latitude, longitude } });
        } else {
          next.set(userId, { userId, name, cursor: { latitude, longitude } });
        }
        return next;
      });
    };

    const handleDisconnect = () => {
      setCollaborators(new Map());
    };

    // Add event listeners
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("cursor-update", handleCursorUpdate);
    socket.on("disconnect", handleDisconnect);

    // Cleanup
    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("cursor-update", handleCursorUpdate);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket]);

  return collaborators;
};
