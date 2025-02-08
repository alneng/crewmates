import { Server, Socket } from "socket.io";
import { prisma } from "../prisma";
import { corsOptions } from "../config";

interface CursorPosition {
  userId: string;
  latitude: number;
  longitude: number;
}

interface WaypointUpdate {
  id: string;
  order: number;
}

export class SocketService {
  private io: Server;

  constructor(server: any) {
    this.io = new Server(server, {
      cors: {
        origin: corsOptions.origin,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.io.on("connection", this.handleConnection.bind(this));
  }

  private async handleConnection(socket: Socket) {
    const userId = socket.handshake.auth.userId;
    const name = socket.handshake.auth.name;
    if (!userId || !name) {
      socket.disconnect();
      return;
    }

    // Join session room
    socket.on("join-session", async (sessionId: string) => {
      const session = await prisma.liveSession.findUnique({
        where: { id: sessionId },
        include: {
          roadTrip: {
            include: {
              members: true,
              owner: true,
            },
          },
        },
      });

      if (!session) {
        socket.emit("error", "Session not found");
        return;
      }

      // Check if user has access
      const hasAccess =
        session.roadTrip.members.some((m) => m.id === userId) ||
        session.roadTrip.ownerId === userId;

      if (!hasAccess) {
        socket.emit("error", "Access denied");
        return;
      }

      await socket.join(sessionId);

      socket.to(sessionId).emit("user-joined", { userId, name });
    });

    // Handle cursor updates
    socket.on("cursor-move", (data: CursorPosition) => {
      const sessionId = Array.from(socket.rooms)[1]; // First room is socket's own room
      if (!sessionId) return;

      socket.to(sessionId).emit("cursor-update", {
        userId,
        name,
        latitude: data.latitude,
        longitude: data.longitude,
      });
    });

    // Handle waypoint updates
    socket.on("waypoint-update", async (data: WaypointUpdate) => {
      const sessionId = Array.from(socket.rooms)[1];
      if (!sessionId) return;

      // Update in database
      await prisma.waypoint.update({
        where: { id: data.id },
        data: { order: data.order },
      });

      socket.to(sessionId).emit("waypoint-updated", data);
    });

    socket.on("disconnect", () => {
      const sessionId = Array.from(socket.rooms)[1];
      if (sessionId) {
        socket.to(sessionId).emit("user-left", { userId, name });
      }
    });
  }
}
