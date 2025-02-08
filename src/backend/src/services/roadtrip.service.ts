import { prisma } from "../prisma";

export class RoadTripService {
  async createRoadTrip({ name, ownerId }: { name: string; ownerId: string }) {
    return prisma.roadTrip.create({
      data: {
        name,
        ownerId,
        members: {
          connect: { id: ownerId }, // Owner is automatically a member
        },
      },
      include: {
        owner: true,
        members: true,
        waypoints: true,
      },
    });
  }

  async getUserRoadTrips(userId: string) {
    return prisma.roadTrip.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
      },
      include: {
        owner: true,
        members: true,
        waypoints: {
          orderBy: { order: "asc" },
        },
      },
    });
  }

  async getRoadTrip(id: string) {
    return prisma.roadTrip.findUnique({
      where: { id },
      include: {
        owner: true,
        members: true,
        waypoints: {
          orderBy: { order: "asc" },
        },
      },
    });
  }

  async updateRoadTrip(id: string, data: any) {
    return prisma.roadTrip.update({
      where: { id },
      data,
      include: {
        owner: true,
        members: true,
        waypoints: true,
      },
    });
  }

  async deleteRoadTrip(id: string) {
    return prisma.roadTrip.delete({
      where: { id },
    });
  }

  async addMember(roadTripId: string, email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return prisma.roadTrip.update({
      where: { id: roadTripId },
      data: {
        members: {
          connect: { id: user.id },
        },
      },
      include: {
        owner: true,
        members: true,
      },
    });
  }

  async removeMember(roadTripId: string, userId: string) {
    return prisma.roadTrip.update({
      where: { id: roadTripId },
      data: {
        members: {
          disconnect: { id: userId },
        },
      },
      include: {
        owner: true,
        members: true,
      },
    });
  }

  async addWaypoint(
    roadTripId: string,
    data: { name: string; latitude: number; longitude: number }
  ) {
    const lastWaypoint = await prisma.waypoint.findFirst({
      where: { roadTripId },
      orderBy: { order: "desc" },
    });

    const order = lastWaypoint ? lastWaypoint.order + 1 : 0;

    return prisma.waypoint.create({
      data: {
        ...data,
        order,
        roadTripId,
      },
    });
  }

  async updateWaypoint(id: string, data: any) {
    return prisma.waypoint.update({
      where: { id },
      data,
    });
  }

  async deleteWaypoint(id: string) {
    return prisma.waypoint.delete({
      where: { id },
    });
  }
}
