import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";
import { HttpException } from "../utils/errors.utils";

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
    return prisma.$transaction(async (tx) => {
      const lastWaypoint = await tx.waypoint.findFirst({
        where: { roadTripId },
        orderBy: { order: "desc" },
      });

      const order = lastWaypoint ? lastWaypoint.order + 1 : 0;

      const newWaypoint = await tx.waypoint.create({
        data: {
          ...data,
          order,
          roadTripId,
        },
      });

      // Normalize orders after adding to ensure no gaps
      await this.normalizeWaypointOrders(roadTripId, tx);

      return newWaypoint;
    });
  }

  async updateWaypoint(id: string, data: any) {
    const waypoint = await prisma.waypoint.findUnique({
      where: { id },
      include: { roadTrip: true },
    });

    if (!waypoint) {
      throw new HttpException(404, "Waypoint not found");
    }

    // If order is being updated, use the specialized order update method
    if (typeof data.order === "number") {
      return this.updateWaypointOrder(waypoint.roadTripId, id, data.order);
    }

    // For non-order updates, just update the waypoint directly
    return prisma.waypoint.update({
      where: { id },
      data,
    });
  }

  async updateWaypointOrder(
    roadTripId: string,
    waypointId: string,
    newOrder: number
  ) {
    return prisma.$transaction(async (tx) => {
      // Get all waypoints for this road trip
      const waypoints = await tx.waypoint.findMany({
        where: { roadTripId },
        orderBy: { order: "asc" },
      });

      const currentWaypoint = waypoints.find((wp) => wp.id === waypointId);
      if (!currentWaypoint) {
        throw new HttpException(404, "Waypoint not found");
      }

      // Ensure newOrder is within bounds
      const maxOrder = waypoints.length - 1;
      const boundedNewOrder = Math.max(0, Math.min(newOrder, maxOrder));

      // Remove waypoint from current position and insert at new position
      const reorderedWaypoints = waypoints.filter((wp) => wp.id !== waypointId);
      reorderedWaypoints.splice(boundedNewOrder, 0, currentWaypoint);

      // Update all waypoints with their new orders
      const updates = reorderedWaypoints.map((waypoint, index) =>
        tx.waypoint.update({
          where: { id: waypoint.id },
          data: { order: index },
        })
      );

      await Promise.all(updates);
      return currentWaypoint;
    });
  }

  async deleteWaypoint(id: string) {
    const waypoint = await prisma.waypoint.findUnique({
      where: { id },
      include: { roadTrip: true },
    });

    if (!waypoint) {
      throw new HttpException(404, "Waypoint not found");
    }

    // Delete the waypoint and reorder remaining waypoints in a transaction
    return prisma.$transaction(async (tx) => {
      await tx.waypoint.delete({
        where: { id },
      });

      // Reorder remaining waypoints to close any gaps
      await this.normalizeWaypointOrders(waypoint.roadTripId, tx);
    });
  }

  /**
   * Private helper method to ensure waypoint orders are sequential without gaps
   */
  private async normalizeWaypointOrders(
    roadTripId: string,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ) {
    // Get all waypoints for this road trip, ordered by their current order
    const waypoints = await tx.waypoint.findMany({
      where: { roadTripId },
      orderBy: { order: "asc" },
    });

    // Update each waypoint's order to ensure sequential ordering
    const updates = waypoints.map((waypoint, index) =>
      tx.waypoint.update({
        where: { id: waypoint.id },
        data: { order: index },
      })
    );

    await Promise.all(updates);
  }
}
