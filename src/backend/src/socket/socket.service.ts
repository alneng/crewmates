import { Server, Socket } from "socket.io";
import { prisma } from "../prisma";
import { corsOptions } from "../config";

interface CursorPosition {
  userId: string;
  latitude: number;
  longitude: number;
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
    const image = socket.handshake.auth.image;
    if (!userId || !name) {
      socket.disconnect();
      return;
    }

    // Store the sessionId when joining
    let currentSessionId: string | null = null;

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

      if (currentSessionId) {
        await socket.leave(currentSessionId);
        socket.to(currentSessionId).emit("user-left", { userId });
      }

      currentSessionId = sessionId;
      await socket.join(sessionId);

      // Broadcast to all clients in the session, including sender
      this.io.in(sessionId).emit("user-joined", { userId, name, image });
    });

    socket.on("cursor-move", (data: CursorPosition) => {
      if (!currentSessionId) return;
      socket.to(currentSessionId).emit("cursor-update", {
        userId,
        name,
        image,
        latitude: data.latitude,
        longitude: data.longitude,
      });
    });

    // Handle waypoint updates
    socket.on("waypoint-update", async () => {
      const sessionId = Array.from(socket.rooms)[1];
      if (!sessionId) return;

      socket.to(sessionId).emit("waypoint-updated");
    });

    socket.on("disconnect", () => {
      if (currentSessionId) {
        this.io.to(currentSessionId).emit("user-left", { userId, name });
      }
    });
  }
}
