import { Server, Socket } from "socket.io";
import { prisma } from "../prisma";

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
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", this.handleConnection.bind(this));
  }

  private async handleConnection(socket: Socket) {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    // Join session room
    socket.on("join-session", async (sessionId: string) => {
      const session = await prisma.liveSession.findUnique({
        where: { id: sessionId },
        include: { roadTrip: true },
      });

      if (!session) {
        socket.emit("error", "Session not found");
        return;
      }

      socket.join(sessionId);
      socket.to(sessionId).emit("user-joined", { userId });
    });

    // Handle cursor updates
    socket.on("cursor-move", (data: CursorPosition) => {
      const sessionId = Array.from(socket.rooms)[1]; // First room is socket's own room
      socket.to(sessionId).emit("cursor-update", {
        userId,
        latitude: data.latitude,
        longitude: data.longitude,
      });
    });

    // Handle waypoint updates
    socket.on("waypoint-update", async (data: WaypointUpdate) => {
      const sessionId = Array.from(socket.rooms)[1];

      // Update in database
      await prisma.waypoint.update({
        where: { id: data.id },
        data: { order: data.order },
      });

      // Broadcast to others
      socket.to(sessionId).emit("waypoint-updated", data);
    });

    socket.on("disconnect", () => {
      const sessionId = Array.from(socket.rooms)[1];
      if (sessionId) {
        socket.to(sessionId).emit("user-left", { userId });
      }
    });
  }
}
