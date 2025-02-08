import { prisma } from "../prisma";
import { addHours } from "date-fns";

export class SessionService {
  async createSession(roadTripId: string) {
    // End any existing active sessions for this road trip
    await this.endActiveSessionsForRoadTrip(roadTripId);

    // Create new session
    return prisma.liveSession.create({
      data: {
        roadTripId,
        expiresAt: addHours(new Date(), 24), // Sessions expire after 24 hours
      },
      include: {
        roadTrip: {
          include: {
            owner: true,
            members: true,
            waypoints: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });
  }

  async getSession(sessionId: string) {
    return prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: {
        roadTrip: {
          include: {
            owner: true,
            members: true,
            waypoints: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });
  }

  async getActiveSession(roadTripId: string) {
    return prisma.liveSession.findFirst({
      where: {
        roadTripId,
        expiresAt: { gt: new Date() },
      },
      include: {
        roadTrip: {
          include: {
            owner: true,
            members: true,
            waypoints: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });
  }

  async endSession(sessionId: string) {
    return prisma.liveSession.delete({
      where: { id: sessionId },
    });
  }

  private async endActiveSessionsForRoadTrip(roadTripId: string) {
    await prisma.liveSession.deleteMany({
      where: {
        roadTripId,
        expiresAt: { gt: new Date() },
      },
    });
  }

  // Utility method to clean up expired sessions
  // This could be called by a CRON job
  async cleanupExpiredSessions() {
    return prisma.liveSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }

  // Method to extend session duration
  async extendSession(sessionId: string, hours: number = 24) {
    return prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        expiresAt: addHours(new Date(), hours),
      },
      include: {
        roadTrip: {
          include: {
            owner: true,
            members: true,
            waypoints: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });
  }

  // Method to get all active sessions for a user
  async getUserActiveSessions(userId: string) {
    return prisma.liveSession.findMany({
      where: {
        expiresAt: { gt: new Date() },
        roadTrip: {
          OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
        },
      },
      include: {
        roadTrip: {
          include: {
            owner: true,
            members: true,
            waypoints: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });
  }
}
